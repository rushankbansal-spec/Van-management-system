// src/common/decorators/owns-resource.decorator.ts
import { SetMetadata } from '@nestjs/common';

/**
 * OwnsResource decorator - used to require resource ownership checks.
 * This guard ensures that:
 * - Parents can only access their own children's data
 * - Drivers can only update trips for their assigned vans
 * 
 * Example usage:
 *   @OwnsResource()
 *   @Get(':studentId')
 *   getStudent() {}
 * 
 *   @OwnsResource()
 *   @Post(':tripId/students/:studentId/pickup')
 *   markPickup() {}
 */
export const OwnsResource = () => SetMetadata('ownsResource', true);
