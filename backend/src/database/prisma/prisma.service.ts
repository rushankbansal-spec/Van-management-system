// src/database/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@generated/prisma';
import { createLogger } from '../../common/logging/logger';

/**
 * PrismaService wraps the PrismaClient with proper lifecycle management.
 * Ensures connections are opened/closed correctly and includes request-scoped
 * transaction support for multi-write operations.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = createLogger('PrismaService');

  constructor(config: ConfigService) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
      // Connection pooling settings for high concurrency
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
      // Performance tuning
      transactionTimeout: 10000, // 10s max for transactions
      socketTimeout: 30000,      // 30s socket timeout
      connectionLimit: 10,       // Max connections in pool (increase for production)
      poolTimeout: 10,           // Connection pool acquisition timeout
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ PostgreSQL connection established');
    } catch (error) {
      this.logger.error('❌ Failed to connect to PostgreSQL', { error });
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.$hasConnected()) {
      await this.$disconnect();
      this.logger.log('🔌 PostgreSQL connection closed');
    }
  }

  /**
   * Execute a query within a transaction with retry logic
   * for handling transient database errors
   */
  async transaction<T>(
    fn: (tx: PrismaService) => Promise<T>,
    options?: { maxRetries?: number; timeout?: number },
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const timeout = options?.timeout ?? 10000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.$transaction(fn, {
          isolationLevel: 'ReadCommitted',
          timeout,
        });
      } catch (error: any) {
        // Handle serialization failures and deadlocks with retry
        if (
          error instanceof Error &&
          (error.message.includes('SerializationFailure') ||
           error.message.includes('DeadlockDetected') ||
           error.code === '40001' ||
           error.code === '40P01') &&
          attempt < maxRetries
        ) {
          this.logger.warn(`Transaction retry ${attempt}/${maxRetries}`, { error: error.message });
          // Exponential backoff
          await this.sleep(Math.pow(2, attempt) * 100);
          continue;
        }
        throw error;
      }
    }

    // Should not reach here, but for type safety
    throw new Error('Transaction failed after all retries');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check database health
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
