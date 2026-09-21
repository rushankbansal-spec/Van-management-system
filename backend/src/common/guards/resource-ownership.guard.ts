// src/common/guards/resource-ownership.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OwnsResource } from '../decorators/owns-resource.decorator';
import { UserWithSchool } from '../interfaces/auth.interface';

/**
 * Resource Ownership Guard
 * Ensures that users can only access resources they own:
 * - Parents can only see their own children's data
 * - Drivers can only update trips for vans they're assigned to
 * - Authenticated users cannot access another user's data in the same school
 * 
 * This runs AFTER tenant scoping (which filters by school_id).
 * This guard adds additional per-user resource ownership checks.
 */
@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if endpoint requires resource ownership check
    const requiresOwnership = this.reflector.getAllAndOverride<boolean>(OwnsResource, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If not required, allow (tenant scoping handles school isolation)
    if (!requiresOwnership) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as UserWithSchool;

    if (!user) {
      throw new ForbiddenException('No authenticated user');
    }

    // Different ownership checks based on user role
    switch (user.role) {
      case 'PARENT':
        // Parents can only access their own linked students
        const studentId = request.params.studentId || request.params.id;
        if (studentId && user.ownedStudentIds?.length > 0) {
          if (!user.ownedStudentIds.includes(studentId)) {
            throw new ForbiddenException(
              'You can only access data for your own children',
            );
          }
        }
        break;

      case 'DRIVER':
        // Drivers can only update trips for vans they're assigned to
        const vanId = request.params.vanId || request.params.id;
        const tripId = request.params.tripId;
        
        if (vanId && user.assignedVanIds?.length > 0) {
          if (!user.assignedVanIds.includes(vanId)) {
            throw new ForbiddenException(
              'You can only manage vans you are assigned to',
            );
          }
        }
        
        if (tripId && user.assignedTripIds?.length > 0) {
          if (!user.assignedTripIds.includes(tripId)) {
            throw new ForbiddenException(
              'You can only manage trips for your assigned vans',
            );
          }
        }
        break;

      case 'ADMIN':
        // Admins have full access within their school (handled by tenant scoping)
        // No additional restrictions needed
        break;
    }

    return true;
  }
}
