import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@generated/prisma';
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
          url: config.get<string>('DATABASE_URL') || config.get<string>('database.url'),
        },
      },
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
    try {
      await this.$disconnect();
      this.logger.log('🔌 PostgreSQL connection closed');
    } catch (error) {
      this.logger.error('❌ Error during PostgreSQL disconnection', { error });
    }
  }

  /**
   * Execute a query within a transaction with retry logic
   * for handling transient database errors
   */
  async transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: { maxRetries?: number; timeout?: number },
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const timeout = options?.timeout ?? 10000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.$transaction(
          async (tx) => {
            return await fn(tx);
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
            timeout,
          },
        );
      } catch (error: any) {
        const errorCode = error?.code || '';
        const errorMessage = error?.message || '';

        // Handle serialization failures and deadlocks with retry
        if (
          (errorMessage.includes('SerializationFailure') ||
            errorMessage.includes('DeadlockDetected') ||
            errorCode === '40001' ||
            errorCode === '40P01') &&
          attempt < maxRetries
        ) {
          this.logger.warn(`Transaction retry ${attempt}/${maxRetries}`, { error: errorMessage });
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
    return new Promise((resolve) => setTimeout(resolve, ms));
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