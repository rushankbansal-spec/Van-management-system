import { IsBoolean } from "class-validator";
import { IsNumber, IsObject } from "class-validator";
// src/auth/dto/auth.dto.ts
import { IsEmail, IsString, MinLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Login DTO - validates login request
 */
export class LoginDto {
  @ApiProperty({ 
    description: 'User email address', 
    example: 'admin@school1.edu',
    required: true,
  })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @ApiProperty({ 
    description: 'User password', 
    example: 'SecurePass123!',
    required: true,
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}

/**
 * Refresh token DTO
 */
export class RefreshTokenDto {
  @ApiProperty({ 
    description: 'Refresh token received from login', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  @IsString()
  refreshToken: string;
}

/**
 * Logout DTO with optional refresh token revocation
 */
export class LogoutDto {
  @ApiPropertyOptional({ 
    description: 'Refresh token to revoke (for immediate logout on current device)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

/**
 * Register DTO - not exposed in public API, used internally for seed/management
 */
export class RegisterDto {
  @ApiProperty({ 
    description: 'School ID (UUID)', 
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsUUID()
  schoolId: string;

  @ApiProperty({ 
    description: 'User email address', 
    example: 'newadmin@school1.edu',
    required: true,
  })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @ApiProperty({ 
    description: 'User password', 
    example: 'SecurePass123!',
    required: true,
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({ 
    description: 'First name', 
    example: 'John',
    required: true,
  })
  @IsString()
  firstName: string;

  @ApiProperty({ 
    description: 'Last name', 
    example: 'Doe',
    required: true,
  })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ 
    description: 'Phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ 
    description: 'User role',
    enum: ['ADMIN', 'DRIVER', 'PARENT'],
    example: 'ADMIN',
    required: true,
  })
  @IsString()
  role: 'ADMIN' | 'DRIVER' | 'PARENT';
}

/**
 * Token response DTO
 */
export class TokenResponseDto {
  @ApiProperty({ description: 'JWT access token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  accessToken: string;

  @ApiProperty({ description: 'Refresh token for obtaining new access tokens', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken: string;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  @IsString()
  tokenType: string;

  @ApiProperty({ description: 'Access token expiration time in seconds', example: 900 })
  @IsNumber()
  expiresIn: number;

  @ApiProperty({ description: 'User profile information', type: UserDto })
  @IsObject()
  user: UserDto;
}

/**
 * User DTO (public view - no sensitive data)
 */
export class UserDto {
  @ApiProperty({ description: 'User UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Email address', example: 'admin@school1.edu' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Phone number', example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'User role', enum: ['ADMIN', 'DRIVER', 'PARENT'], example: 'ADMIN' })
  @IsString()
  role: 'ADMIN' | 'DRIVER' | 'PARENT';

  @ApiProperty({ description: 'Active status', example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'School UUID (tenant)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  schoolId: string;

  @ApiPropertyOptional({ description: 'Last login timestamp', type: String, format: 'date-time' })
  @IsOptional()
  lastLoginAt?: string;
}
