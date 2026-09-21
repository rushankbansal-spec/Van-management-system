// src/auth/services/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import * as argon2 from 'argon2';
import { LoginDto, RefreshTokenDto, LogoutDto, RegisterDto, TokenResponseDto, UserDto } from '../dto/auth.dto';
import { UserWithSchool, JwtPayload, RefreshTokenPayload } from '../../common/interfaces/auth.interface';
import { createLogger, sanitizeForLogging } from '../../common/logging/logger';

/**
 * AuthService handles authentication operations:
 * - User login with JWT issuance
 * - Token refresh with rotation
 * - Logout with token revocation
 * - User registration (internal only)
 * - Password hashing with argon2id
 */
@Injectable()
export class AuthService {
  private readonly logger = createLogger('AuthService');
  private readonly argon2Options: argon2.Options;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    // Configure argon2id parameters
    this.argon2Options = {
      type: argon2.argon2id,
      memoryCost: parseInt(this.config.get('ARGON2_MEMORY_COST') || '65536', 10),
      timeCost: parseInt(this.config.get('ARGON2_TIME_COST') || '3', 10),
      parallelism: parseInt(this.config.get('ARGON2_PARALLELISM') || '4', 10),
      hashLength: 32,
      saltLength: 16,
    };
  }

  /**
   * Authenticate user with email and password
   * Returns access token, refresh token, and user profile
   */
  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const { email, password } = loginDto;

    // Find user with school context
    const user = await this.prisma.user.findUnique({
      where: {
        email_schoolId: {
          email: email.toLowerCase().trim(),
          // Note: schoolId is NOT taken from request - it comes from DB
          // Tenant isolation is enforced by JWT claims in guard
        },
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        schoolId: true,
        lastLoginAt: true,
        assignedVans: {
          select: { id: true },
          where: { isActive: true },
        },
        children: {
          select: { id: true },
          where: { isActive: true },
        },
      },
    });

    if (!user) {
      this.logger.warn('Login attempt with invalid credentials', { 
        email: sanitizeForLogging(email), 
        reason: 'user-not-found' 
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      this.logger.warn('Login attempt on inactive account', { 
        userId: user.id,
        email: sanitizeForLogging(email),
      });
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password with argon2id
    const isValidPassword = await argon2.verify(user.passwordHash, password, this.argon2Options as any);
    if (!isValidPassword) {
      this.logger.warn('Login attempt with invalid credentials', { 
        userId: user.id,
        email: sanitizeForLogging(email),
        reason: 'invalid-password',
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log successful login
    this.logger.log('User logged in successfully', { 
      userId: user.id, 
      email: sanitizeForLogging(email),
      role: user.role,
      schoolId: user.schoolId,
    });

    return {
      ...tokens,
      user: this.toUserDto(user),
    };
  }

  /**
   * Refresh access token using refresh token
   * Implements refresh token rotation for security
   */
  async refresh(refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    const { refreshToken } = refreshTokenDto;

    // Verify refresh token
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      this.logger.warn('Invalid refresh token', { 
        reason: 'token-invalid',
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is revoked or expired
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      this.logger.warn('Refresh token not found', { 
        tokenId: payload.jti,
        reason: 'token-not-found',
      });
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      this.logger.warn('Refresh token expired', { 
        tokenId: payload.jti,
        expiresAt: storedToken.expiresAt,
      });
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (storedToken.revokedAt) {
      this.logger.warn('Refresh token revoked', { 
        tokenId: payload.jti,
        revokedAt: storedToken.revokedAt,
      });
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Check for token reuse (security feature: reject if token already used)
    if (storedToken.usedAt) {
      this.logger.error('Refresh token reuse detected', { 
        tokenId: payload.jti,
        userId: storedToken.userId,
        ip: storedToken.ipAddress,
        userAgent: storedToken.userAgent,
      });
      // Revoke all refresh tokens for this user (compromised session)
      await this.revokeAllUserTokens(storedToken.userId, storedToken.schoolId);
      throw new UnauthorizedException('Security alert: Token reuse detected. All sessions have been revoked.');
    }

    // Fetch user to verify still valid
    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        schoolId: true,
        lastLoginAt: true,
        assignedVans: {
          select: { id: true },
          where: { isActive: true },
        },
        children: {
          select: { id: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or account deactivated');
    }

    // Mark old token as used (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { usedAt: new Date() },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Store new refresh token
    await this.storeRefreshToken(user, tokens.refreshToken, storedToken.ipAddress, storedToken.userAgent);

    // Log token rotation
    this.logger.log('Token refreshed', { 
      userId: user.id,
      email: sanitizeForLogging(user.email),
      role: user.role,
      schoolId: user.schoolId,
    });

    return {
      ...tokens,
      user: this.toUserDto(user),
    };
  }

  /**
   * Logout user - revoke refresh token if provided
   */
  async logout(logoutDto: LogoutDto, user: UserWithSchool): Promise<void> {
    const { refreshToken } = logoutDto;

    if (refreshToken) {
      // Revoke the specific refresh token
      await this.prisma.refreshToken.updateMany({
        where: {
          token: refreshToken,
          userId: user.id,
          schoolId: user.schoolId,
        },
        data: { 
          revokedAt: new Date(),
          usedAt: new Date(), // Also mark as used to prevent reuse
        },
      });
      this.logger.log('Refresh token revoked on logout', { 
        userId: user.id,
        schoolId: user.schoolId,
      });
    }

    // Note: Access token will expire naturally
    // If we had a blocklist, we'd add it here with TTL matching access token expiry
  }

  /**
   * Register a new user (internal/seed use only)
   */
  async register(registerDto: RegisterDto): Promise<TokenResponseDto> {
    const { schoolId, email, password, firstName, lastName, phone, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        schoolId: schoolId,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists in this school');
    }

    // Hash password
    const passwordHash = await argon2.hash(password, this.argon2Options as any);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        schoolId,
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        role,
        isActive: true,
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
        assignedVans: {
          select: { id: true },
          where: { isActive: true },
        },
        children: {
          select: { id: true },
        },
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    this.logger.log('User registered', { 
      userId: user.id,
      email: sanitizeForLogging(email),
      role,
      schoolId,
    });

    return {
      ...tokens,
      user: this.toUserDto(user),
    };
  }

  /**
   * Change password for a user
   */
  async changePassword(
    userId: string,
    schoolId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId, schoolId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isValid = await argon2.verify(user.passwordHash, currentPassword, this.argon2Options as any);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await argon2.hash(newPassword, this.argon2Options as any);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all refresh tokens (force re-login)
    await this.revokeAllUserTokens(userId, schoolId);

    this.logger.log('Password changed', { userId, schoolId });
  }

  // ========== Private Methods ==========

  /**
   * Generate access and refresh tokens for a user
   */
  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const now = Math.floor(Date.now() / 1000);
    const accessExpiration = this.parseExpiration(this.config.get('JWT_ACCESS_EXPIRATION') || '15m');
    const refreshExpiration = this.parseExpiration(this.config.get('JWT_REFRESH_EXPIRATION') || '7d');

    // Access token payload
    const accessPayload: JwtPayload = {
      sub: user.id,
      schoolId: user.schoolId,
      role: user.role,
      iat: now,
      exp: now + accessExpiration,
      aud: this.config.get('JWT_AUDIENCE'),
      iss: this.config.get('JWT_ISSUER'),
    };

    // Refresh token payload
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      schoolId: user.schoolId,
      role: user.role,
      jti: crypto.randomUUID(), // Unique ID for token revocation
      iat: now,
      exp: now + refreshExpiration,
      aud: this.config.get('JWT_AUDIENCE'),
      iss: this.config.get('JWT_ISSUER'),
    };

    const accessToken = this.jwtService.signAsync(accessPayload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: accessExpiration,
    });

    const refreshToken = this.jwtService.signAsync(refreshPayload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiration,
    });

    // Wait for both promises
    const [access, refresh] = await Promise.all([accessToken,
      refreshToken]);

    return {
      accessToken: access,
      refreshToken: refresh,
      tokenType: 'Bearer',
      expiresIn: accessExpiration,
    };
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(
    user: any,
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const refreshExpiration = this.parseExpiration(this.config.get('JWT_REFRESH_EXPIRATION') || '7d');
    const expiresAt = new Date(Date.now() + refreshExpiration * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        schoolId: user.schoolId,
        token,
        expiresAt,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    // Also store in Redis for faster revocation checks
    await this.redis.set(`refresh_token:${token}`, '1', refreshExpiration);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  private async revokeAllUserTokens(userId: string, schoolId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, schoolId },
      data: { revokedAt: new Date() },
    });

    // Clear Redis cache
    const keys = await this.redis.keys(`refresh_token:*`);
    for (const key of keys) {
      await this.redis.del(key);
    }

    this.logger.log('All user tokens revoked', { userId, schoolId });
  }

  /**
   * Convert user entity to DTO (removes sensitive data)
   */
  private toUserDto(user: any): UserDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      schoolId: user.schoolId,
      lastLoginAt: user.lastLoginAt?.toISOString(),
    };
  }

  /**
   * Parse expiration string (e.g., "15m", "7d") to seconds
   */
  private parseExpiration(exp: string): number {
    const match = exp.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiration format: ${exp}`);
    }
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    
    return value * multipliers[unit];
  }
}
