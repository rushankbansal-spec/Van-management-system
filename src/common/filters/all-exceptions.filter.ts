// src/common/filters/all-exceptions.filter.ts
import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';
import { createLogger } from '../logging/logger';

/**
 * Global exception filter - catches all exceptions and returns standardized responses.
 * Logs errors with request context and sanitizes sensitive data.
 */
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = createLogger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request as any).requestId || 'unknown';
    const path = request.url;
    const method = request.method;

    let status: number;
    let message: string;
    let errorDetails: any;

    // Handle known HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, any>;
        message = resp.message || 'Error';
        errorDetails = resp.error || resp.error_description || resp.details;
      } else {
        message = 'An error occurred';
      }
    }
    // Handle Prisma errors
    else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = this.getPrismaErrorMessage(exception);
      this.logger.error('Prisma error', {
        requestId,
        path,
        method,
        error: exception.message,
        stack: exception.stack,
      });
    }
    // Unknown errors
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      this.logger.error('Unknown error', {
        requestId,
        path,
        method,
        error: String(exception),
      });
    }

    // Don't leak internal error details in production
    if (process.env.NODE_ENV === 'production' && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      message = 'An internal error occurred';
    }

    // Log the error (without sensitive data)
    this.logger.error('Request failed', {
      requestId,
      path,
      method,
      status,
      message,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    // Send standardized response
    response.status(status).json({
      statusCode: status,
      message,
      error: errorDetails || message,
      requestId, // For support tracing
      timestamp: new Date().toISOString(),
    });
  }

  private getPrismaErrorMessage(error: Error): string {
    const msg = error.message;

    if (msg.includes('P2025')) return 'Record not found';
    if (msg.includes('P2003')) return 'Foreign key constraint violation';
    if (msg.includes('P2002')) return 'Unique constraint violation';
    if (msg.includes('P2024')) return 'Query timed out';
    if (msg.includes('P2034')) return 'Query cancelled';
    if (msg.includes('SerializationFailure') || msg.includes('DeadlockDetected')) 
      return 'Database conflict, please retry';
    
    return 'Database error';
  }
}
