// src/health/health.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { RedisService } from '../database/redis/redis.service';
import { createLogger } from '../common/logging/logger';

/**
 * HealthService
 * Provides health check endpoints for load balancers and monitoring.
 * 
 * Endpoints:
 * - GET /health: Comprehensive health check (DB, Redis, app)
 * - GET /ready: Readiness check (can serve traffic)
 * - GET /live: Liveness check (process is alive)
 */
@Injectable()
export class HealthService {
  private readonly logger = createLogger('HealthService');

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Comprehensive health check
   * Returns status of all dependencies
   */
  async check(): Promise<{
    status: 'ok' | 'degraded' | 'down';
    timestamp: string;
    uptime: number;
    services: {
      database: { status: 'ok' | 'error'; latency?: number };
      redis: { status: 'ok' | 'error'; latency?: number };
    };
    version: string;
  }> {
    const startTime = Date.now();
    
    const [dbResult, redisResult] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const dbLatency = dbResult.latency;
    const redisLatency = redisResult.latency;
    
    const allOk = dbResult.status === 'ok' && redisResult.status === 'ok';
    const anyOk = dbResult.status === 'ok' || redisResult.status === 'ok';
    
    let status: 'ok' | 'degraded' | 'down';
    if (allOk) {
      status = 'ok';
    } else if (anyOk) {
      status = 'degraded';
    } else {
      status = 'down';
    }

    this.logger.log('Health check', {
      status,
      dbStatus: dbResult.status,
      redisStatus: redisResult.status,
    });

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: dbResult.status,
          latency: dbLatency,
        },
        redis: {
          status: redisResult.status,
          latency: redisLatency,
        },
      },
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  /**
   * Readiness check
   * Returns OK if the service can serve traffic
   * Used by Kubernetes/load balancers to determine if pod should receive requests
   */
  async readinessCheck(): Promise<{
    status: 'ready' | 'not_ready';
    timestamp: string;
    checks: {
      database: 'ok' | 'error';
      redis: 'ok' | 'error';
    };
  }> {
    // For readiness, we require database to be available
    // Redis can be degraded (cache miss is acceptable)
    const dbOk = await this.checkDatabase().then(r => r.status === 'ok');
    
    // Redis is optional for readiness (can serve from DB)
    const redisOk = await this.checkRedis().then(r => r.status === 'ok');

    const status = dbOk ? 'ready' : 'not_ready';

    return {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbOk ? 'ok' : 'error',
        redis: redisOk ? 'ok' : 'error',
      },
    };
  }

  /**
   * Liveness check
   * Returns OK if the process is running
   * Always returns 200 if this code is executing
   */
  async livenessCheck(): Promise<{
    status: 'alive';
    timestamp: string;
    uptime: number;
  }> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<{ status: 'ok' | 'error'; latency?: number }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        latency: Date.now() - start,
      };
    } catch (error) {
      this.logger.error('Database health check failed', {
        error: error.message,
      });
      return {
        status: 'error',
        latency: Date.now() - start,
      };
    }
  }

  /**
   * Check Redis connectivity
   */
  private async checkRedis(): Promise<{ status: 'ok' | 'error'; latency?: number }> {
    const start = Date.now();
    try {
      await this.redis.isHealthy();
      return {
        status: 'ok',
        latency: Date.now() - start,
      };
    } catch (error) {
      this.logger.warn('Redis health check failed', {
        error: error.message,
      });
      return {
        status: 'error',
        latency: Date.now() - start,
      };
    }
  }
}
