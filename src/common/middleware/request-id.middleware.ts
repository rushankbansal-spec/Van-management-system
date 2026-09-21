// src/common/middleware/request-id.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../logging/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID Middleware
 * Generates or propagates a unique request ID for tracing.
 * Adds X-Request-ID header to all logs for correlation.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = createLogger('RequestIdMiddleware');

  use(req: Request, res: Response, next: NextFunction): void {
    // Use existing request ID or generate new one
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    
    // Attach to request for downstream access
    (req as any).requestId = requestId;
    
    // Set header for response
    res.setHeader('X-Request-ID', requestId);
    
    // Store in response for logging
    (res as any).requestId = requestId;
    
    this.logger.debug('Request ID assigned', { 
      requestId,
      path: req.path,
      method: req.method,
    });
    
    next();
  }
}
