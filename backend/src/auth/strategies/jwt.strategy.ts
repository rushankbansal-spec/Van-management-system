// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UserWithSchool } from '../../common/interfaces/auth.interface';

/**
 * JWT Strategy
 * Validates access tokens and attaches user info to request.
 * 
 * Token payload structure:
 * {
 *   sub: string (user ID),
 *   schoolId: string,
 *   role: 'ADMIN' | 'DRIVER' | 'PARENT',
 *   iat: number,
 *   exp: number,
 *   aud: string,
 *   iss: string
 * }
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      algorithms: ['HS256'],
      // Validate audience and issuer
      audience: configService.get('JWT_AUDIENCE'),
      issuer: configService.get('JWT_ISSUER'),
    });
  }

  async validate(payload: any): Promise<UserWithSchool> {
    const userId = payload.sub;
    const schoolId = payload.schoolId;
    const role = payload.role;

    if (!userId || !schoolId || !role) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Fetch user from database with school context
    // Only return non-sensitive fields
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
        schoolId: schoolId,  // Ensure user belongs to this school
        deletedAt: null,     // Not soft-deleted
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        schoolId: true,
        lastLoginAt: true,
        // For ownership checks
        children: user.role === 'PARENT' ? {
          select: {
            id: true,
          },
        } : false,
        assignedVans: user.role === 'DRIVER' ? {
          select: {
            id: true,
          },
        } : false,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or access denied');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Build user object with owned resource IDs for ownership guard
    const ownedStudentIds = user.children?.map((c: any) => c.id) || [];
    const assignedVanIds = user.assignedVans?.map((v: any) => v.id) || [];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      schoolId: user.schoolId,
      lastLoginAt: user.lastLoginAt,
      ownedStudentIds,
      assignedVanIds,
      assignedTripIds: [], // Will be populated per-trip if needed
    };
  }
}
