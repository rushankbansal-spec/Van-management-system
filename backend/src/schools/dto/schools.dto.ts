// src/schools/dto/schools.dto.ts
import { IsString, IsOptional, IsBoolean, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSchoolDto {
  @ApiProperty({ description: 'School name', example: 'Lincoln Elementary School', required: true })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(200, { message: 'Name must not exceed 200 characters' })
  name: string;

  @ApiProperty({ description: 'School code (unique identifier)', example: 'LES', required: true })
  @IsString()
  @MinLength(2, { message: 'Code must be at least 2 characters' })
  @MaxLength(50, { message: 'Code must not exceed 50 characters' })
  code: string;

  @ApiPropertyOptional({ description: 'School address', example: '123 Main St, Springfield, IL 62701' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'School phone number', example: '+15551234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'School contact email', example: 'admin@lincoln.edu' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Timezone for the school', example: 'America/Chicago', default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateSchoolDto {
  @ApiPropertyOptional({ description: 'School name', example: 'Lincoln Elementary School (Updated)' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'School address', example: '456 Oak Ave, Springfield, IL 62702' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'School phone number', example: '+15559876543' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'School contact email', example: 'admin@lincoln.edu' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Timezone for the school', example: 'America/Chicago' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SchoolDto {
  @ApiProperty({ description: 'School UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'School name', example: 'Lincoln Elementary School' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'School code', example: 'LES' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'School address', example: '123 Main St, Springfield, IL 62701' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'School phone', example: '+15551234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'School email', example: 'admin@lincoln.edu' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Timezone', example: 'America/Chicago' })
  @IsString()
  timezone: string;

  @ApiProperty({ description: 'Active status', example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Created timestamp', example: '2024-01-15T10:30:00Z', format: 'date-time' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Updated timestamp', example: '2024-01-15T10:30:00Z', format: 'date-time' })
  @IsString()
  updatedAt: string;
}

export class SchoolListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search by name or code', example: 'Lincoln' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Number of records to skip', example: 0, minimum: 0 })
  @IsOptional()
  @IsUUID()
  skip?: number = 0;

  @ApiPropertyOptional({ description: 'Number of records to take', example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsUUID()
  take?: number = 20;
}
