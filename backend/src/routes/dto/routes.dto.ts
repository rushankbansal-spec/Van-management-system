// src/routes/dto/routes.dto.ts
import { IsString, IsOptional, IsInt, IsUUID, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRouteDto {
  @ApiProperty({ description: 'Route name', example: 'North Route - Morning Pickup', required: true })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Route description', example: 'Morning pickup route for north side students' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Route stops in order', type: [CreateRouteStopDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRouteStopDto)
  stops?: CreateRouteStopDto[];
}

export class CreateRouteStopDto {
  @ApiProperty({ description: 'Stop name', example: 'Main Street & Oak Avenue', required: true })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Latitude', example: 40.7128, required: true })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: -74.0060, required: true })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ description: 'Street address', example: '123 Main St' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Estimated arrival time (minutes from midnight)', example: 360 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1439)
  estimatedArrival?: number;
}

export class UpdateRouteDto {
  @ApiPropertyOptional({ description: 'Route name', example: 'North Route - Morning Pickup (Updated)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Route description', example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Route stops', type: [CreateRouteStopDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRouteStopDto)
  stops?: CreateRouteStopDto[];
}

export class RouteDto {
  @ApiProperty({ description: 'Route UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'School UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  schoolId: string;

  @ApiProperty({ description: 'Route name', example: 'North Route - Morning Pickup' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Route description', example: 'Morning pickup route for north side students' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Active status', example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Route stops', type: [RouteStopDto] })
  @IsArray()
  stops: any[];

  @ApiProperty({ description: 'Number of vans assigned', example: 2 })
  @IsInt()
  vanCount: number;

  @ApiProperty({ description: 'Created timestamp', format: 'date-time' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Updated timestamp', format: 'date-time' })
  @IsString()
  updatedAt: string;
}

export class RouteStopDto {
  @ApiProperty({ description: 'Stop UUID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Stop order', example: 1 })
  @IsInt()
  stopOrder: number;

  @ApiProperty({ description: 'Stop name', example: 'Main Street & Oak Avenue' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Latitude', example: 40.7128 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: -74.0060 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ description: 'Street address', example: '123 Main St' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Estimated arrival time (minutes from midnight)', example: 360 })
  @IsOptional()
  @IsInt()
  estimatedArrival?: number;
}

export class RouteListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search by name', example: 'North' })
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
