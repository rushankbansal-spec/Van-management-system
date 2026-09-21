// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@generated/prisma';

/**
 * Roles Guard
 * Checks if the authenticated user has the required role(s) for the endpoint.
 * Uses the @Roles() decorator to declare required roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from the endpoint decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, allow all authenticated users
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get the authenticated user
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No authenticated user');
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. User role: ${user.role}`,
      );
    }

    return true;
  }
}
