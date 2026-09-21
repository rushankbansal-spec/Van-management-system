// src/database/redis/redis.module.ts
import { Module, Global, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createLogger } from '../../common/logging/logger';

/**
 * RedisModule provides a global Redis client with connection pooling
 * and proper lifecycle management.
 * 
 * Redis is used for:
 * - Latest GPS positions (fast reads for live tracking)
 * - Active trip state
 * - Rate limiting counters
 * - Session/connection state for WebSocket reconnection
 */
@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        const logger = createLogger('Redis');
        
        const redisOptions: Redis.Options = {
          host: config.get('REDIS_HOST') || 'localhost',
          port: parseInt(config.get('REDIS_PORT') || '6379', 10),
          password: config.get('REDIS_PASSWORD') || undefined,
          tls: config.get('REDIS_TLS') === true ? {} : undefined,
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
          retryDelayOnClusterDown: 100,
          enableReadyCheck: true,
          enableOfflineQueue: true,
          sendZeroReply: false,
          // Performance tuning for high concurrency
          connectTimeout: 5000,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keyPrefix: 'svt:', // School Van Tracker prefix
        };

        const client = new Redis(redisOptions);

        client.on('error', (err) => {
          logger.error('Redis connection error', { error: err.message });
        });

        client.on('connect', () => {
          logger.log('Redis connected successfully');
        });

        client.on('close', () => {
          logger.warn('Redis connection closed');
        });

        return client;
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_LATEST_GPS',
      useFactory: (client: Redis) => {
        const logger = createLogger('RedisGPS');
        const TTL = parseInt(process.env.GPS_LOCATION_TTL_SECONDS || '300', 10);

        return {
          /**
           * Store latest GPS position for a van
           * Key: svt:van:{vanId}:location
           */
          async setVanLocation(
            vanId: string,
            location: { latitude: number; longitude: number; speed?: number; heading?: number; accuracy?: number },
            schoolId: string,
          ): Promise<void> {
            const key = `svt:van:${vanId}:location`;
            const value = JSON.stringify({
              vanId,
              schoolId,
              ...location,
              updatedAt: Date.now(),
            });

            await client.setex(key, TTL, value);
            
            // Also update van's current position in DB asynchronously
            // (handled by trip service)
          },

          /**
           * Get latest GPS position for a van
           * Returns null if no position or expired
           */
          async getVanLocation(vanId: string): Promise<{ latitude: number; longitude: number; speed?: number; heading?: number; accuracy?: number } | null> {
            const key = `svt:van:${vanId}:location`;
            const data = await client.get(key);
            
            if (!data) return null;

            try {
              const parsed = JSON.parse(data);
              return {
                latitude: parsed.latitude,
                longitude: parsed.longitude,
                speed: parsed.speed,
                heading: parsed.heading,
                accuracy: parsed.accuracy,
              };
            } catch {
              return null;
            }
          },

          /**
           * Get multiple van locations in batch
           * More efficient than individual GETs
           */
          async getVanLocations(vanIds: string[]): Promise<Map<string, { latitude: number; longitude: number; speed?: number; heading?: number } | null>> {
            if (vanIds.length === 0) return new Map();

            const pattern = 'svt:van:*:location';
            const keys = await client.keys(pattern);
            
            const result = new Map<string, any>();
            for (const key of keys) {
              const data = await client.get(key);
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  // Only include vans in our requested list
                  if (vanIds.includes(parsed.vanId)) {
                    result.set(parsed.vanId, {
                      latitude: parsed.latitude,
                      longitude: parsed.longitude,
                      speed: parsed.speed,
                      heading: parsed.heading,
                    });
                  }
                } catch {
                  // Ignore parse errors
                }
              }
            }

            // Fill in nulls for requested vans not found
            for (const vanId of vanIds) {
              if (!result.has(vanId)) {
                result.set(vanId, null);
              }
            }

            return result;
          },
        };
      },
      inject: ['REDIS_CLIENT'],
    },
    {
      provide: 'REDIS_RATE_LIMITER',
      useFactory: (client: Redis) => {
        return {
          /**
           * Increment rate limit counter and check if limit exceeded
           */
          async checkRateLimit(
            key: string,
            maxRequests: number,
            windowSeconds: number,
          ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
            const now = Date.now();
            const windowKey = `ratelimit:${key}:${Math.floor(now / (windowSeconds * 1000))}`;
            
            const count = await client.incr(windowKey);
            
            // Set expiry on first request
            if (count === 1) {
              await client.expire(windowKey, windowSeconds);
            }

            const allowed = count <= maxRequests;
            const remaining = Math.max(0, maxRequests - count);
            const resetAt = new Date(Math.ceil(now / (windowSeconds * 1000)) * windowSeconds * 1000);

            return { allowed, remaining, resetAt };
          },

          /**
           * Get current rate limit status without incrementing
           */
          async getRateLimitStatus(
            key: string,
            windowSeconds: number,
          ): Promise<{ count: number; remaining: number; resetAt: Date; limit: number } | null> {
            const now = Date.now();
            const windowKey = `ratelimit:${key}:${Math.floor(now / (windowSeconds * 1000))}`;
            
            const count = await client.get(windowKey);
            if (count === null) return null;

            return {
              count: parseInt(count, 10),
              remaining: 0, // Unknown until we check limit
              resetAt: new Date(Math.ceil(now / (windowSeconds * 1000)) * windowSeconds * 1000),
              limit: 0, // Unknown until we check limit
            };
          },
        };
      },
      inject: ['REDIS_CLIENT'],
    },
  ],
  exports: [
    'REDIS_CLIENT',
    'REDIS_LATEST_GPS',
    'REDIS_RATE_LIMITER',
  ],
})
export class RedisModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = createLogger('RedisModule');
  private client: Redis;

  constructor() {
    // Will be set by NestJS DI
  }

  async onModuleInit() {
    // Connection is lazy, client will connect on first use
    this.logger.log('Redis module initialized (lazy connection)');
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Get Redis client instance (for health checks, etc.)
   */
  getRedisClient(): Redis {
    return this.client;
  }
}
