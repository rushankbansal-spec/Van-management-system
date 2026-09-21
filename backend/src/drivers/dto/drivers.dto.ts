// src/drivers/dto/drivers.dto.ts
import { IsString, IsOptional, IsInt, IsUUID, Min, Max, IsBoolean, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDriverDto {
  @ApiProperty({ description: 'Driver email', example: 'driver@school.edu', required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Driver password', example: 'SecurePass123!', required: true, minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'First name', example: 'John', required: true })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Smith', required: true })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+15551234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Driver license number', example: 'D1234567' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'License expiry date', format: 'date' })
  @IsOptional()
  @IsString()
  licenseExpiry?: string;
}

export class UpdateDriverDto {
  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Smith' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+15559876543' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Driver license number', example: 'D7654321' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'License expiry date', format: 'date' })
  @IsOptional()
  @IsString()
  licenseExpiry?: string;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DriverDto {
  @ApiProperty({ description: 'Driver UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'School UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  schoolId: string;

  @ApiProperty({ description: 'Email', example: 'driver@school.edu' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Smith' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Full name', example: 'John Smith' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'Phone', example: '+15551234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Driver license number', example: 'D1234567' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'License expiry date', format: 'date' })
  @IsOptional()
  @IsString()
  licenseExpiry?: string;

  @ApiProperty({ description: 'Role', example: 'DRIVER' })
  @IsString()
  role: string;

  @ApiProperty({ description: 'Active status', example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Assigned van', type: VanInfoDto })
  @IsOptional()
  van?: any;

  @ApiProperty({ description: 'Created timestamp', format: 'date-time' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Updated timestamp', format: 'date-time' })
  @IsString()
  updatedAt: string;
}

export class VanInfoDto {
  @ApiProperty({ description: 'Van UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Van name', example: 'Van 1 - Route A' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Plate number', example: 'ABC-1234' })
  @IsString()
  plateNumber: string;
}

export class DriverListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search by name or email', example: 'John' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Number of records to skip', example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  skip?: number = 0;

  @ApiPropertyOptional({ description: 'Number of records to take', example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  take?: number = 20;
}
