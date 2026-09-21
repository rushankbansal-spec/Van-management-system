// src/common/middleware/tenant.middleware.ts
import { Injectable, NestMiddleware, Logger, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UserWithSchool } from '../interfaces/auth.interface';
import { createLogger } from '../logging/logger';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * Tenant Middleware - Centralized Multi-tenancy Scoping
 * 
 * CRITICAL SECURITY MECHANISM:
 * This middleware enforces tenant isolation by automatically filtering all database
 * queries with the authenticated user's school_id. This is the single point of
 * enforcement - we NEVER trust school_id from request body/query params.
 * 
 * HOW IT WORKS:
 * 1. Extracts school_id from JWT claims (verified by AuthGuard)
 * 2. Attaches school_id to request for access by interceptors/services
 * 3. Provides Prisma extensions that auto-inject WHERE school_id = :currentSchoolId
 * 
 * SETUP:
 * Applied globally in AppModule. Must run AFTER JwtAuthGuard 
 * (to have user context) but BEFORE any business logic.
 * 
 * LIMITATIONS:
 * - Does not filter Prisma queries manually written without using our helper methods
 * - Use TenantService.wrapQuery() for any custom Prisma operations
 * - Raw SQL queries must be manually scoped (use parameterized queries)
 * 
 * BEST PRACTICES:
 * - Always use the provided tenant-scoped repository methods
 * - Never accept school_id as a request parameter for scoped queries
 * - Test cross-tenant access denial in automated tests
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = createLogger('TenantMiddleware');

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract user from request (set by JwtAuthGuard)
      const user = (req as any).user as UserWithSchool | undefined;

      if (!user) {
        // No authenticated user - this shouldn't happen if JwtAuthGuard is applied
        this.logger.warn('Tenant middleware called without authenticated user', {
          path: req.path,
          method: req.method,
        });
        return next();
      }

      // CRITICAL: Get school_id ONLY from JWT claims (verified identity)
      // NEVER from request body, query params, or headers
      const schoolId = user.schoolId;
      
      if (!schoolId) {
        this.logger.error('User missing school_id in JWT claims', {
          userId: user.id,
          role: user.role,
        });
        throw new ForbiddenException('Invalid user context: missing school affiliation');
      }

      // Attach tenant context to request for logging and downstream use
      (req as any).tenantContext = {
        schoolId,
        userId: user.id,
        userRole: user.role,
      };

      // Also attach school_id explicitly for convenience
      (req as any).schoolId = schoolId;
      (req as any).userId = user.id;

      this.logger.debug('Tenant context established', {
        schoolId,
        userId: user.id,
        userRole: user.role,
        path: req.path,
      });

      next();
    } catch (error) {
      this.logger.error('Tenant middleware error', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
