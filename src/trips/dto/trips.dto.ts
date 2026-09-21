// src/trips/dto/trips.dto.ts
import { IsString, IsOptional, IsInt, IsUUID, IsBoolean, IsNumber, IsEnum, IsArray, IsDateString, IsEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TripType {
  PICKUP = 'PICKUP',
  DROP = 'DROP',
}

export enum TripStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SOS_ACTIVE = 'SOS_ACTIVE',
}

export class CreateTripDto {
  @ApiProperty({ description: 'Van ID', example: '550e8400-e29b-41d4-a716-446655440000', required: true })
  @IsUUID()
  vanId: string;

  @ApiProperty({ description: 'Route ID (optional)', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiProperty({ description: 'Trip type', enum: TripType, example: TripType.PICKUP, required: true })
  @IsEnum(TripType)
  tripType: TripType;

  @ApiProperty({ description: 'Scheduled start time', example: '2024-01-15T08:00:00Z', required: true, format: 'date-time' })
  @IsDateString()
  scheduledStart: string;

  @ApiPropertyOptional({ description: 'Expected duration in minutes', example: 45 })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedDurationMinutes?: number;

  @ApiPropertyOptional({ description: 'Start location coordinates', type: StartEndLocationDto })
  @IsOptional()
  @IsObject()
  startLocation?: StartEndLocationDto;

  @ApiPropertyOptional({ description: 'End location coordinates', type: StartEndLocationDto })
  @IsOptional()
  @IsObject()
  endLocation?: StartEndLocationDto;

  @ApiPropertyOptional({ description: 'Notes', example: 'Special pickup instructions' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StartEndLocationDto {
  @ApiProperty({ description: 'Latitude', example: 40.7128 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: -74.0060 })
  @IsNumber()
  longitude: number;
}

export class StartTripDto {
  @ApiProperty({ description: 'Trip ID', example: '550e8400-e29b-41d4-a716-446655440000', required: true })
  @IsUUID()
  tripId: string;

  @ApiProperty({ description: 'Actual start location', type: StartEndLocationDto, required: true })
  @IsObject()
  location: StartEndLocationDto;
}

export class EndTripDto {
  @ApiProperty({ description: 'Trip ID', example: '550e8400-e29b-41d4-a716-446655440000', required: true })
  @IsUUID()
  tripId: string;

  @ApiProperty({ description: 'Actual end location', type: StartEndLocationDto, required: true })
  @IsObject()
  location: StartEndLocationDto;

  @ApiPropertyOptional({ description: 'Notes', example: 'Trip completed successfully' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TripLocationDto {
  @ApiProperty({ description: 'Latitude', example: 40.7128, required: true })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: -74.0060, required: true })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ description: 'Speed km/h', example: 45 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  speed?: number;

  @ApiPropertyOptional({ description: 'Heading degrees (0-360)', example: 180 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({ description: 'GPS accuracy in meters', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;
}

export class MarkPickupDto {
  @ApiProperty({ description: 'Trip ID', example: '550e8400-e29b-41d4-a716-446655440000', required: true })
  @IsUUID()
  tripId: string;

  @ApiProperty({ description: 'Student ID', example: '550e8400-e29b-41d4-a716-446655440001', required: true })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'Location where pickup/drop occurred', type: TripLocationDto, required: true })
  @IsObject()
  location: TripLocationDto;

  @ApiPropertyOptional({ description: 'Idempotency key to prevent duplicate processing', example: 'uuid-v4-key' })
  @IsOptional()
  @IsString()
  @IsUUID()
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Student was waiting at the corner' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkAbsentDto {
  @ApiProperty({ description: 'Trip ID', example: '550e8400-e29b-41d4-a716-446655440000', required: true })
  @IsUUID()
  tripId: string;

  @ApiProperty({ description: 'Student ID', example: '550e8400-e29b-41d4-a716-446655440001', required: true })
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({ description: 'Idempotency key', example: 'uuid-v4-key' })
  @IsOptional()
  @IsString()
  @IsUUID()
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Reason for absence', example: 'Student stayed home' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SosActivateDto {
  @ApiProperty({ description: 'Trip ID', example: '550e8400-e29b-41d4-a716-446655440000', required: true })
  @IsUUID()
  tripId: string;

  @ApiProperty({ description: 'SOS reason', example: 'Vehicle breakdown', required: true })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Current location', type: TripLocationDto })
  @IsOptional()
  @IsObject()
  location?: TripLocationDto;
}

export class SosResolveDto {
  @ApiProperty({ description: 'Trip ID', example: '550e8400-e29b-41d4-a716-446655440000', required: true })
  @IsUUID()
  tripId: string;

  @ApiPropertyOptional({ description: 'Resolution notes', example: 'Towing service arrived, continuing with backup van' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether trip will continue', example: true })
  @IsOptional()
  @IsBoolean()
  willContinue?: boolean;
}

export class TripDto {
  @ApiProperty({ description: 'Trip UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'School UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  schoolId: string;

  @ApiProperty({ description: 'Van UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  vanId: string;

  @ApiPropertyOptional({ description: 'Route UUID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiProperty({ description: 'Driver UUID', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID()
  driverId: string;

  @ApiProperty({ description: 'Trip type', enum: TripType, example: TripType.PICKUP })
  @IsEnum(TripType)
  tripType: TripType;

  @ApiProperty({ description: 'Trip status', enum: TripStatus, example: TripStatus.NOT_STARTED })
  @IsEnum(TripStatus)
  status: TripStatus;

  @ApiProperty({ description: 'Scheduled start time', format: 'date-time' })
  @IsDateString()
  scheduledStart: string;

  @ApiPropertyOptional({ description: 'Actual start time', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  actualStart?: string;

  @ApiPropertyOptional({ description: 'Actual end time', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  actualEnd?: string;

  @ApiPropertyOptional({ description: 'Expected duration in minutes', example: 45 })
  @IsOptional()
  @IsInt()
  expectedDurationMinutes?: number;

  @ApiPropertyOptional({ description: 'Start location', type: StartEndLocationDto })
  @IsOptional()
  @IsObject()
  startLocation?: StartEndLocationDto;

  @ApiPropertyOptional({ description: 'End location', type: StartEndLocationDto })
  @IsOptional()
  @IsObject()
  endLocation?: StartEndLocationDto;

  @ApiPropertyOptional({ description: 'SOS activated status', example: false })
  @IsOptional()
  @IsBoolean()
  sosActivated?: boolean;

  @ApiPropertyOptional({ description: 'SOS activated time', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  sosActivatedAt?: string;

  @ApiPropertyOptional({ description: 'SOS resolved time', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  sosResolvedAt?: string;

  @ApiPropertyOptional({ description: 'SOS reason', example: 'Vehicle breakdown' })
  @IsOptional()
  @IsString()
  sosReason?: string;

  @ApiPropertyOptional({ description: 'Trip notes', example: 'Special pickup instructions' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Number of pickups/drops completed', example: 8 })
  @IsInt()
  pickupCount: number;

  @ApiProperty({ description: 'Created timestamp', format: 'date-time' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Updated timestamp', format: 'date-time' })
  @IsString()
  updatedAt: string;
}

export class TripListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: TripStatus, example: TripStatus.IN_PROGRESS })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @ApiPropertyOptional({ description: 'Filter by van ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  vanId?: string;

  @ApiPropertyOptional({ description: 'Filter by driver ID', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Filter by trip type', enum: TripType, example: TripType.PICKUP })
  @IsOptional()
  @IsEnum(TripType)
  tripType?: TripType;

  @ApiPropertyOptional({ description: 'Filter by scheduled start date range', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter by scheduled start date range', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Number of records to skip', example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  skip?: number = 0;

  @ApiPropertyOptional({ description: 'Number of records to take', example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  take?: number = 20;
}

export class TripHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Start date for history range', example: '2024-01-01', required: true })
  @IsDateString()
  from: string;

  @ApiPropertyOptional({ description: 'End date for history range', example: '2024-01-31', required: true })
  @IsDateString()
  to: string;

  @ApiPropertyOptional({ description: 'Number of records to skip', example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  skip?: number = 0;

  @ApiPropertyOptional({ description: 'Number of records to take', example: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  take?: number = 50;
}

export class TripWithDetailsDto extends TripDto {
  @ApiPropertyOptional({ description: 'Van details', type: VanInfoDto })
  @IsOptional()
  @IsObject()
  van?: any;

  @ApiPropertyOptional({ description: 'Driver details', type: DriverInfoDto })
  @IsOptional()
  @IsObject()
  driver?: any;

  @ApiPropertyOptional({ description: 'Route details', type: RouteInfoDto })
  @IsOptional()
  @IsObject()
  route?: any;

  @ApiPropertyOptional({ description: 'Pickup log count for this trip', example: 8 })
  @IsOptional()
  @IsInt()
  pickupLogCount?: number;

  @ApiPropertyOptional({ description: 'Latest location from Redis', type: TripLocationDto })
  @IsOptional()
  @IsObject()
  latestLocation?: TripLocationDto;
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

export class DriverInfoDto {
  @ApiProperty({ description: 'Driver UUID', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Full name', example: 'John Smith' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email', example: 'driver@school.edu' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ description: 'Phone', example: '+15551234567' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class RouteInfoDto {
  @ApiProperty({ description: 'Route UUID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Route name', example: 'North Route' })
  @IsString()
  name: string;
}

export class PickupLogDto {
  @ApiProperty({ description: 'Pickup log UUID', example: '550e8400-e29b-41d4-a716-446655440003' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Trip UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  tripId: string;

  @ApiProperty({ description: 'Student UUID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'Student name', example: 'Emma Johnson' })
  @IsString()
  studentName: string;

  @ApiProperty({ description: 'Action', enum: ['PICKED_UP', 'DROPPED_OFF', 'ABSENT'], example: 'PICKED_UP' })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Action taken timestamp', format: 'date-time' })
  @IsDateString()
  actionTakenAt: string;

  @ApiPropertyOptional({ description: 'Location at time of action', type: TripLocationDto })
  @IsOptional()
  @IsObject()
  location?: TripLocationDto;

  @ApiPropertyOptional({ description: 'Notes', example: 'Student was waiting at the corner' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Verified by driver', type: DriverInfoDto })
  @IsOptional()
  @IsObject()
  verifiedBy?: any;
}
