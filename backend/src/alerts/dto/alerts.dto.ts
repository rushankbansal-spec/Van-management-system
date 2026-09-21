import { MaxLength } from "class-validator";
// src/alerts/dto/alerts.dto.ts
import { IsString, IsOptional, IsInt, IsUUID, IsBoolean, IsEnum, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum AlertType {
  SOS = 'SOS',
  SOS_RESOLVED = 'SOS_RESOLVED',
  DELAY = 'DELAY',
  ABSENCE = 'ABSENCE',
  CUSTOM = 'CUSTOM',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateAlertDto {
  @ApiProperty({ description: 'Alert type', enum: AlertType, example: AlertType.CUSTOM, required: true })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiProperty({ description: 'Alert severity', enum: AlertSeverity, example: AlertSeverity.MEDIUM, required: true })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiPropertyOptional({ description: 'Van ID (if alert is about a van)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  vanId?: string;

  @ApiPropertyOptional({ description: 'Trip ID (if alert is about a trip)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  tripId?: string;

  @ApiPropertyOptional({ description: 'Student ID (if alert is about a student)', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Driver ID (if alert is about a driver)', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional({ description: 'User ID to notify (admin/parent)', example: '550e8400-e29b-41d4-a716-446655440003' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ description: 'Alert title', example: 'Student Pickup Delayed', required: true })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Alert message', example: 'Van is running 10 minutes late due to traffic', required: true })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Additional data (JSON)', example: { delayMinutes: 10, routeId: '...' } })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class UpdateAlertDto {
  @ApiPropertyOptional({ description: 'Alert severity', enum: AlertSeverity, example: AlertSeverity.HIGH })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiPropertyOptional({ description: 'Mark as read', example: true })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Alert title', example: 'Updated title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Alert message', example: 'Updated message' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Additional data (JSON)', example: { updated: true } })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class AlertDto {
  @ApiProperty({ description: 'Alert UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'School UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  schoolId: string;

  @ApiProperty({ description: 'Alert type', enum: AlertType, example: AlertType.SOS })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiProperty({ description: 'Alert severity', enum: AlertSeverity, example: AlertSeverity.CRITICAL })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiPropertyOptional({ description: 'Van UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  vanId?: string;

  @ApiPropertyOptional({ description: 'Trip UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  tripId?: string;

  @ApiPropertyOptional({ description: 'Student UUID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Driver UUID', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional({ description: 'User UUID (recipient)', example: '550e8400-e29b-41d4-a716-446655440003' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ description: 'Alert title', example: 'SOS Alert - Driver Emergency' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Alert message', example: 'Driver activated SOS: Vehicle breakdown' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Additional data', example: { location: {} } })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiProperty({ description: 'Read status', example: false })
  @IsBoolean()
  isRead: boolean;

  @ApiPropertyOptional({ description: 'Read timestamp', format: 'date-time' })
  @IsOptional()
  @IsString()
  readAt?: string;

  @ApiProperty({ description: 'Created timestamp', format: 'date-time' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Updated timestamp', format: 'date-time' })
  @IsString()
  updatedAt: string;
}

export class AlertListQueryDto {
  userId?: string;
  @ApiPropertyOptional({ description: 'Filter by type', enum: AlertType, example: AlertType.SOS })
  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType;

  @ApiPropertyOptional({ description: 'Filter by severity', enum: AlertSeverity, example: AlertSeverity.CRITICAL })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiPropertyOptional({ description: 'Filter by van ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  vanId?: string;

  @ApiPropertyOptional({ description: 'Filter by trip ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  tripId?: string;

  @ApiPropertyOptional({ description: 'Filter by student ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Filter by isRead status', example: false })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Number of records to skip', example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  skip?: number = 0;

  @ApiPropertyOptional({ description: 'Number of records to take', example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  take?: number = 20;
}

export class MarkReadDto {
  @ApiProperty({ description: 'Alert IDs to mark as read', type: [String], example: ['550e8400-e29b-41d4-a716-446655440000'] })
  @IsArray()
  @IsUUID('4', { each: true })
  alertIds: string[];
}
