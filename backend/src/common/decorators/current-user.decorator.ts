// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserWithSchool } from '../interfaces/auth.interface';

/**
 * CurrentUser decorator - extracts the authenticated user from the request.
 * Usage: @CurrentUser() user: UserWithSchool
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserWithSchool => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UserWithSchool;
  },
);
