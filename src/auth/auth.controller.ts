// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { LoginDto, RefreshTokenDto, LogoutDto, TokenResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserWithSchool } from '../common/interfaces/auth.interface';

/**
 * Auth Controller
 * Handles authentication endpoints:
 * - POST /auth/login
 * - POST /auth/refresh
 * - POST /auth/logout
 * - POST /auth/register (internal only - for seed/management)
 */
@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User login
   * Returns access token, refresh token, and user profile
   * 
   * @deprecated Use POST /auth/login with body { email, password }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login', description: 'Authenticate with email and password to receive JWT tokens' })
  @ApiResponse({ status: 200, description: 'Login successful', type: TokenResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    // Rate limiting should be applied at gateway/middleware level
    return this.authService.login(loginDto);
  }

  /**
   * Refresh access token
   * Uses refresh token rotation - old token is invalidated, new pair issued
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token', description: 'Exchange a valid refresh token for a new access token pair' })
  @ApiResponse({ status: 200, description: 'Token refreshed', type: TokenResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid refresh token' })
  @ApiResponse({ status: 401, description: 'Unauthorized or token expired' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refresh(refreshTokenDto);
  }

  /**
   * Logout user
   * Revokes refresh token if provided (immediate logout)
   * Access token expires naturally
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'User logout', description: 'Revoke refresh token and end session' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @Body() logoutDto: LogoutDto,
    @Request() req: any,
  ): Promise<void> {
    const user = req.user as UserWithSchool;
    return this.authService.logout(logoutDto, user);
  }

  /**
   * Register new user (INTERNAL ONLY - not for public API)
   * Used by seed scripts and admin management endpoints
   * In production, this would be restricted to admins or a separate management API
   */
  @Post('register')
  @UseGuards(JwtAuthGuard)
  // @UseGuards(RolesGuard) // Uncomment to restrict to admins only
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register user', description: 'Create a new user account (INTERNAL USE ONLY)' })
  @ApiResponse({ status: 201, description: 'User registered', type: TokenResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or user exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async register(@Body() registerDto: any): Promise<TokenResponseDto> {
    // In production, add admin-only guard here
    return this.authService.register(registerDto);
  }

  /**
   * Change password
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change password', description: 'Change user password with current password verification' })
  @ApiResponse({ status: 204, description: 'Password changed' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Body() body: { currentPassword: string; newPassword: string },
    @Request() req: any,
  ): Promise<void> {
    const user = req.user as UserWithSchool;
    return this.authService.changePassword(
      user.id,
      user.schoolId,
      body.currentPassword,
      body.newPassword,
    );
  }
}
