// src/vans/dto/vans.dto.ts
import { IsString, IsOptional, IsInt, IsNumber, IsUUID, Min, Max, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateVanDto {
  @ApiProperty({ description: 'Van name/identifier', example: 'Van 1 - Route A', required: true })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'License plate number', example: 'ABC-1234', required: true })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  plateNumber: string;

  @ApiProperty({ description: 'Passenger capacity', example: 15, required: true, minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  capacity: number;

  @ApiPropertyOptional({ description: 'Vehicle make', example: 'Ford' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ description: 'Vehicle model', example: 'Transit' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Vehicle year', example: 2020 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2030)
  year?: number;

  @ApiPropertyOptional({ description: 'Vehicle color', example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Driver ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Route IDs', type: [String], example: ['550e8400-e29b-41d4-a716-446655440001'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  routeIds?: string[];
}

export class UpdateVanDto {
  @ApiPropertyOptional({ description: 'Van name/identifier', example: 'Van 1 - Route A (Updated)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Passenger capacity', example: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  capacity?: number;

  @ApiPropertyOptional({ description: 'Vehicle make', example: 'Ford' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ description: 'Vehicle model', example: 'Transit' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Vehicle year', example: 2021 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2030)
  year?: number;

  @ApiPropertyOptional({ description: 'Vehicle color', example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Driver ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Route IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  routeIds?: string[];

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class VanDto {
  @ApiProperty({ description: 'Van UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'School UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  schoolId: string;

  @ApiProperty({ description: 'Van name/identifier', example: 'Van 1 - Route A' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'License plate number', example: 'ABC-1234' })
  @IsString()
  plateNumber: string;

  @ApiProperty({ description: 'Passenger capacity', example: 15 })
  @IsInt()
  capacity: number;

  @ApiPropertyOptional({ description: 'Vehicle make', example: 'Ford' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ description: 'Vehicle model', example: 'Transit' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Vehicle year', example: 2020 })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ description: 'Vehicle color', example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Driver', type: UserDto })
  @IsOptional()
  driver?: any;

  @ApiPropertyOptional({ description: 'Assigned routes', type: [RouteDto] })
  @IsOptional()
  routes?: any[];

  @ApiProperty({ description: 'Active status', example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Current latitude (from Redis)', example: 40.7128 })
  @IsOptional()
  @IsNumber()
  currentLatitude?: number;

  @ApiPropertyOptional({ description: 'Current longitude (from Redis)', example: -74.0060 })
  @IsOptional()
  @IsNumber()
  currentLongitude?: number;

  @ApiPropertyOptional({ description: 'Current speed km/h', example: 45 })
  @IsOptional()
  @IsNumber()
  currentSpeed?: number;

  @ApiPropertyOptional({ description: 'Current heading degrees', example: 180 })
  @IsOptional()
  @IsNumber()
  currentHeading?: number;

  @ApiPropertyOptional({ description: 'Last GPS update timestamp', format: 'date-time' })
  @IsOptional()
  lastGpsUpdate?: string;

  @ApiProperty({ description: 'Created timestamp', format: 'date-time' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Updated timestamp', format: 'date-time' })
  @IsString()
  updatedAt: string;
}

export class VanListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by driver ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Search by name or plate number', example: 'Van 1' })
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

export class AssignDriverDto {
  @ApiProperty({ description: 'Driver user ID to assign', example: '550e8400-e29b-41d4-a716-446655440000', required: true })
  @IsUUID()
  driverId: string;
}

export class UnassignDriverDto {
  @ApiProperty({ description: 'Remove driver assignment', example: true, required: true })
  @IsBoolean()
  confirmed: boolean;
}

export class UserDto {
  @ApiProperty({ description: 'User UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email', example: 'driver@school.edu' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Phone', example: '+15551234567' })
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Role', example: 'DRIVER' })
  @IsString()
  role: string;
}

export class RouteDto {
  @ApiProperty({ description: 'Route UUID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Route name', example: 'North Route' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Route description', example: 'Morning pickup route' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Active status', example: true })
  @IsBoolean()
  isActive: boolean;
}
