// src/common/interceptors/tenant.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';

/**
 * Tenant Awareness Interceptor
 * 
 * This interceptor provides additional tenant context to the request pipeline.
 * It validates that tenant-scoped endpoints have proper tenant context.
 * 
 * Note: The actual tenant filtering is done in service methods via TenantService.
 * This interceptor is for validation and enrichment only.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    
    const tenantContext = (request as any).tenantContext;
    const user = (request as any).user;
    
    // For endpoints that don't require authentication, skip tenant check
    // (health checks, etc.)
    const requiresAuth = this.reflector.getAllAndOverride<boolean>('requiresAuth', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiresAuth && !tenantContext) {
      return next.handle();
    }
    
    // Validate tenant context exists for scoped endpoints
    if (!tenantContext && user) {
      throw new ForbiddenException(
        'Tenant context not established. Please authenticate properly.',
      );
    }
    
    return next.handle();
  }
}
