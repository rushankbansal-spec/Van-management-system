// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '@generated/prisma';

/**
 * Roles decorator - used to declare required roles for an endpoint.
 * Example usage:
 *   @Roles('ADMIN')
 *   @Get()
 *   getVans() {}
 * 
 *   @Roles('ADMIN', 'DRIVER')
 *   @Post()
 *   createTrip() {}
 * 
 * Multiple roles: user must have ANY of the specified roles.
 */
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
