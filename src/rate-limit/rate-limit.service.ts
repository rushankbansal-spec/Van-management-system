// src/rate-limit/rate-limit.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../database/redis/redis.service';
import { createLogger } from '../common/logging/logger';

/**
 * RateLimitService
 * Centralized rate limiting using Redis.
 * Provides rate limit checking for different endpoint categories:
 * - Auth endpoints (stricter limit)
 * - GPS ping endpoints (higher limit for frequent pings)
 * - General endpoints (standard limit)
 */
@Injectable()
export class RateLimitService {
  private readonly logger = createLogger('RateLimitService');

  constructor(
    @Inject('REDIS_RATE_LIMITER') private rateLimiter: any,
    private config: ConfigService,
  ) {}

  /**
   * Check rate limit for auth endpoints
   * Stricter limit: 5 requests per window
   */
  async checkAuthRateLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    retryAfter?: number;
  }> {
    const maxRequests = parseInt(this.config.get('RATE_LIMIT_MAX_AUTH_REQUESTS') || '5', 10);
    const windowSeconds = parseInt(this.config.get('RATE_LIMIT_TTL') || '60', 10);

    const result = await this.rateLimiter.checkRateLimit(
      `auth:${identifier}`,
      maxRequests,
      windowSeconds,
    );

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.resetAt,
      retryAfter: result.allowed ? undefined : Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
    };
  }

  /**
   * Check rate limit for GPS ping endpoints
   * Higher limit: 20 requests per window (drivers ping every 5-10s)
   */
  async checkGpsRateLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    retryAfter?: number;
  }> {
    const maxRequests = parseInt(this.config.get('RATE_LIMIT_MAX_GPS_REQUESTS') || '20', 10);
    const windowSeconds = parseInt(this.config.get('RATE_LIMIT_TTL') || '60', 10);

    const result = await this.rateLimiter.checkRateLimit(
      `gps:${identifier}`,
      maxRequests,
      windowSeconds,
    );

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.resetAt,
      retryAfter: result.allowed ? undefined : Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
    };
  }

  /**
   * Check rate limit for general endpoints
   * Standard limit: 100 requests per window
   */
  async checkGeneralRateLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    retryAfter?: number;
  }> {
    const maxRequests = parseInt(this.config.get('RATE_LIMIT_MAX_GENERAL') || '100', 10);
    const windowSeconds = parseInt(this.config.get('RATE_LIMIT_TTL') || '60', 10);

    const result = await this.rateLimiter.checkRateLimit(
      `general:${identifier}`,
      maxRequests,
      windowSeconds,
    );

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.resetAt,
      retryAfter: result.allowed ? undefined : Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
    };
  }

  /**
   * Get rate limit headers for response
   */
  getRateLimitHeaders(result: { remaining: number; resetAt: Date; retryAfter?: number }): {
    'X-RateLimit-Limit': string;
    'X-RateLimit-Remaining': string;
    'X-RateLimit-Reset': string;
    'Retry-After'?: string;
  } {
    // Note: We don't know the limit here without passing it in
    // In production, you'd include the limit in the result
    return {
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetAt.toISOString(),
      ...(result.retryAfter !== undefined && { 'Retry-After': result.retryAfter.toString() }),
    };
  }
}
