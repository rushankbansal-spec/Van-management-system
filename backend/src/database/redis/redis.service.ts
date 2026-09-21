// src/database/redis/redis.service.ts
import { Injectable, Inject, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { createLogger } from '../../common/logging/logger';

/**
 * RedisService provides a centralized Redis client for:
 * - Latest GPS positions (fast lookups for live tracking)
 * - Rate limiting counters
 * - Active trip state
 * - Cache for frequently accessed data
 * - Session management for WebSocket reconnection
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = createLogger('RedisService');
  private client: Redis;
  private isConnected = false;

  constructor(@Inject('REDIS_CLIENT') private redisClient: Redis) {
    this.client = redisClient;
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.isConnected = true;
      this.logger.log('Redis connection established');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', { error: error.message });
      // Don't throw - allow app to start with degraded Redis functionality
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Check Redis connection health
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get Redis client for direct operations
   */
  getClient(): Redis {
    return this.client;
  }

  // ========== GPS Position Operations ==========

  /**
   * Store latest GPS position for a van
   * Key: svt:van:{vanId}:location
   * TTL: GPS_LOCATION_TTL_SECONDS (default 5 minutes)
   */
  async setVanLocation(
    vanId: string,
    location: {
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
      accuracy?: number;
    },
    schoolId: string,
    ttlSeconds?: number,
  ): Promise<void> {
    const key = `svt:van:${vanId}:location`;
    const ttl = ttlSeconds || parseInt(process.env.GPS_LOCATION_TTL_SECONDS || '300', 10);
    
    const value = JSON.stringify({
      vanId,
      schoolId,
      ...location,
      updatedAt: Date.now(),
    });

    try {
      await this.client.setex(key, ttl, value);
    } catch (error) {
      this.logger.error('Failed to store van location', { vanId, error: error.message });
      throw error;
    }
  }

  /**
   * Get latest GPS position for a van
   */
  async getVanLocation(vanId: string): Promise<{
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    schoolId?: string;
    updatedAt?: number;
  } | null> {
    const key = `svt:van:${vanId}:location`;
    
    try {
      const data = await this.client.get(key);
      if (!data) return null;

      return JSON.parse(data);
    } catch (error) {
      this.logger.error('Failed to get van location', { vanId, error: error.message });
      return null;
    }
  }

  /**
   * Get multiple van locations in a single batch operation
   * Uses pipeline for efficiency
   */
  async getVanLocations(vanIds: string[]): Promise<Map<string, any>> {
    if (vanIds.length === 0) return new Map();

    const results = new Map<string, any>();
    
    try {
      const pipeline = this.client.pipeline();
      for (const vanId of vanIds) {
        pipeline.get(`svt:van:${vanId}:location`);
      }
      
      const responses = await pipeline.exec();
      
      for (let i = 0; i < vanIds.length; i++) {
        const vanId = vanIds[i];
        const response = responses[i];
        
        if (response && response[0] === 'ok' && response[1]) {
          try {
            results.set(vanId, JSON.parse(response[1]));
          } catch {
            results.set(vanId, null);
          }
        } else {
          results.set(vanId, null);
        }
      }
    } catch (error) {
      this.logger.error('Failed to batch get van locations', { error: error.message });
    }

    return results;
  }

  /**
   * Get all active van locations for a school
   * Uses SCAN instead of KEYS for production safety
   */
  async getSchoolVanLocations(schoolId: string): Promise<Map<string, any>> {
    const pattern = `svt:van:*:location`;
    const results = new Map<string, any>();
    
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        
        for (const key of keys) {
          const data = await this.client.get(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.schoolId === schoolId) {
                results.set(parsed.vanId, parsed);
              }
            } catch {
              // Skip malformed data
            }
          }
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.error('Failed to scan van locations', { schoolId, error: error.message });
    }

    return results;
  }

  // ========== Rate Limiting ==========

  /**
   * Increment rate limit counter using atomic increment
   * Returns: { allowed: boolean, remaining: number, resetAt: Date }
   */
  async checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const now = Date.now();
    const windowKey = `ratelimit:${identifier}:${Math.floor(now / (windowSeconds * 1000))}`;
    
    try {
      const count = await this.client.incr(windowKey);
      
      // Set expiry on first request of window
      if (count === 1) {
        await this.client.expire(windowKey, windowSeconds);
      }

      const allowed = count <= maxRequests;
      const remaining = Math.max(0, maxRequests - count);
      const resetAt = new Date(Math.ceil(now / (windowSeconds * 1000)) * windowSeconds * 1000);

      return { allowed, remaining, resetAt };
    } catch (error) {
      this.logger.error('Rate limit check failed', { identifier, error: error.message });
      // Fail open - allow request if Redis is down
      return { allowed: true, remaining: maxRequests, resetAt: new Date(now + windowSeconds * 1000) };
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(
    identifier: string,
    windowSeconds: number,
    maxRequests: number,
  ): Promise<{ count: number; remaining: number; resetAt: Date } | null> {
    const now = Date.now();
    const windowKey = `ratelimit:${identifier}:${Math.floor(now / (windowSeconds * 1000))}`;
    
    try {
      const count = await this.client.get(windowKey);
      if (count === null) {
        return {
          count: 0,
          remaining: maxRequests,
          resetAt: new Date(Math.ceil(now / (windowSeconds * 1000)) * windowSeconds * 1000),
        };
      }

      return {
        count: parseInt(count, 10),
        remaining: Math.max(0, maxRequests - parseInt(count, 10)),
        resetAt: new Date(Math.ceil(now / (windowSeconds * 1000)) * windowSeconds * 1000),
      };
    } catch (error) {
      this.logger.error('Rate limit status check failed', { identifier, error: error.message });
      return null;
    }
  }

  // ========== Trip State ==========

  /**
   * Store active trip state for a van
   */
  async setActiveTrip(tripId: string, vanId: string, schoolId: string): Promise<void> {
    const key = `svt:trip:${tripId}:active`;
    const data = JSON.stringify({
      tripId,
      vanId,
      schoolId,
      startedAt: Date.now(),
    });

    await this.client.set(key, data, 'EX', 86400); // 24h TTL
  }

  /**
   * Get active trip for a van
   */
  async getActiveTrip(vanId: string): Promise<{ tripId: string; schoolId: string; startedAt: number } | null> {
    const pattern = `svt:trip:*:active`;
    
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        
        for (const key of keys) {
          const data = await this.client.get(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.vanId === vanId) {
              return parsed;
            }
          }
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.error('Failed to get active trip', { vanId, error: error.message });
    }

    return null;
  }

  /**
   * Remove active trip
   */
  async removeActiveTrip(tripId: string): Promise<void> {
    await this.client.del(`svt:trip:${tripId}:active`);
  }

  // ========== WebSocket Connection State ==========

  /**
   * Store WebSocket connection info for a driver
   */
  async setDriverConnection(
    driverId: string,
    connectionId: string,
    vanId: string,
    schoolId: string,
  ): Promise<void> {
    const key = `svt:connection:${connectionId}`;
    const data = JSON.stringify({
      driverId,
      vanId,
      schoolId,
      connectedAt: Date.now(),
    });

    // Set with TTL for stale connection cleanup
    await this.client.setex(key, 3600, data); // 1 hour

    // Also store reverse lookup
    await this.client.set(`svt:driver:${driverId}:connection`, connectionId, 'EX', 3600);
  }

  /**
   * Remove WebSocket connection
   */
  async removeDriverConnection(connectionId: string): Promise<void> {
    const key = `svt:connection:${connectionId}`;
    const data = await this.client.get(key);
    
    await this.client.del(key);
    
    if (data) {
      const parsed = JSON.parse(data);
      await this.client.del(`svt:driver:${parsed.driverId}:connection`);
    }
  }

  /**
   * Get connection info
   */
  async getDriverConnection(driverId: string): Promise<{ connectionId: string; vanId: string } | null> {
    const connectionId = await this.client.get(`svt:driver:${driverId}:connection`);
    if (!connectionId) return null;

    const key = `svt:connection:${connectionId}`;
    const data = await this.client.get(key);
    
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      return {
        connectionId,
        vanId: parsed.vanId,
      };
    } catch {
      return null;
    }
  }

  // ========== Cache Operations ==========

  /**
   * Generic cache set with TTL
   */
  async cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.client.setex(key, ttlSeconds, JSON.stringify(value));
  }

  /**
   * Generic cache get
   */
  async cacheGet<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  /**
   * Generic cache delete
   */
  async cacheDelete(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Delete keys by pattern (use with caution in production)
   */
  async deletePattern(pattern: string): Promise<number> {
    let cursor = '0';
    let deleted = 0;

    do {
      const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        deleted += await this.client.del(...keys);
      }
    } while (cursor !== '0');

    return deleted;
  }

  // ========== Pub/Sub for Real-time Events ==========

  /**
   * Publish event to a channel
   */
  async publish(channel: string, message: any): Promise<void> {
    await this.client.publish(channel, JSON.stringify(message));
  }

  /**
   * Subscribe to a channel (returns async iterator for events)
   * Note: This is for server-side subscription, not client-side
   */
  async subscribe(channel: string): Promise<AsyncIterable<any>> {
    const subscriber = this.client.duplicate('sub');
    await subscriber.subscribe(channel);

    return {
      [Symbol.asyncIterator]: () => ({
        next: async () => {
          const message = await new Promise<{ channel: string; message: string }>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout')), 30000);
            subscriber.on('message', (ch, msg) => {
              clearTimeout(timeout);
              resolve({ channel: ch, message: msg });
            });
          });
          try {
            return { value: JSON.parse(message.message), done: false };
          } catch {
            return { value: message.message, done: false };
          }
        },
      }),
    };
  }
}
