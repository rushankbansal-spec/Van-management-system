// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { createLogger } from '../logging/logger';

/**
 * Logging Interceptor - logs all requests with timing and request IDs.
 * Does NOT log request body or response body at info level to avoid PII.
 * Uses structured JSON logging when LOG_FORMAT=json.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = createLogger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const requestId = (request as any).requestId || 'unknown';
    const tenantContext = (request as any).tenantContext;
    const user = (request as any).user;
    
    const start = Date.now();
    const { method, url, path } = request;
    
    // Log request start
    this.logger.log('Request started', {
      requestId,
      method,
      path,
      tenantId: tenantContext?.schoolId,
      userId: user?.id,
      userRole: user?.role,
      // DON'T log headers or body here - may contain PII
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          const statusCode = response.statusCode;
          
          // Log successful response
          this.logger.log('Request completed', {
            requestId,
            method,
            path,
            statusCode,
            duration: `${duration}ms`,
            tenantId: tenantContext?.schoolId,
            // DON'T log response body - may contain PII
          });
        },
        error: (error) => {
          const duration = Date.now() - start;
          
          // Error is already logged by exception filter
          // Here we just add timing context
          this.logger.warn('Request failed', {
            requestId,
            method,
            path,
            duration: `${duration}ms`,
            errorName: error.name,
            errorMessage: error.message,
            // DON'T log full error stack to avoid leaking internals
          });
        },
      }),
    );
  }
}
