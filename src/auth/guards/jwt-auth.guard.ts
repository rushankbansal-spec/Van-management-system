// src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * JWT Authentication Guard
 * Uses Passport's JWT strategy to validate access tokens.
 * Runs BEFORE tenant scoping so we have the user's school_id in claims.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    if (err || !user) {
      // Clear any Cookie headers that might have been set
      const response = context.switchToHttp().getResponse();
      response.clearCookie('accessToken');
      response.clearCookie('refreshToken');
      
      if (info) {
        throw err || new Error(info.message);
      }
      throw err || new Error('Authentication required');
    }
    return user;
  }
}
