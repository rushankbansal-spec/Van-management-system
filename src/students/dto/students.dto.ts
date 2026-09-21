// src/students/dto/students.dto.ts
import { IsString, IsOptional, IsDateString, IsUUID, IsBoolean, IsInt, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateStudentDto {
  @ApiProperty({ description: 'First name', example: 'Emma', required: true })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Johnson', required: true })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ description: 'Date of birth', example: '2015-03-15', format: 'date' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Gender', example: 'Female', enum: ['Male', 'Female', 'Other', 'Prefer not to say'] })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ description: 'Parent user ID', example: '550e8400-e29b-41d4-a716-446655440000', required: true })
  @IsUUID()
  parentId: string;

  @ApiPropertyOptional({ description: 'Assigned van ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  vanId?: string;

  @ApiPropertyOptional({ description: 'Emergency contact name', example: 'Jane Johnson (Mother)' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone', example: '+15551234567' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ description: 'Medical information (allergies, conditions)', example: 'Peanut allergy' })
  @IsOptional()
  @IsString()
  medicalInfo?: string;

  @ApiPropertyOptional({ description: 'Photo URL', example: 'https://example.com/photos/emma.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class UpdateStudentDto {
  @ApiPropertyOptional({ description: 'First name', example: 'Emma' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Johnson' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Date of birth', example: '2015-03-15', format: 'date' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Gender', example: 'Female' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Assigned van ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  vanId?: string;

  @ApiPropertyOptional({ description: 'Emergency contact name', example: 'Jane Johnson (Mother)' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone', example: '+15551234567' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ description: 'Medical information', example: 'Peanut allergy' })
  @IsOptional()
  @IsString()
  medicalInfo?: string;

  @ApiPropertyOptional({ description: 'Photo URL', example: 'https://example.com/photos/emma.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class StudentDto {
  @ApiProperty({ description: 'Student UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'School UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  schoolId: string;

  @ApiProperty({ description: 'First name', example: 'Emma' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Johnson' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Full name', example: 'Emma Johnson' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'Date of birth', format: 'date' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Age (calculated from DOB)', example: 9 })
  @IsOptional()
  @IsInt()
  age?: number;

  @ApiPropertyOptional({ description: 'Gender', example: 'Female' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ description: 'Parent user', type: ParentDto })
  @IsObject()
  parent: any;

  @ApiPropertyOptional({ description: 'Assigned van', type: VanDto })
  @IsOptional()
  @IsObject()
  van?: any;

  @ApiProperty({ description: 'Active status', example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Created timestamp', format: 'date-time' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Updated timestamp', format: 'date-time' })
  @IsString()
  updatedAt: string;
}

export class ParentDto {
  @ApiProperty({ description: 'Parent UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Full name', example: 'Robert Johnson' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email', example: 'parent@school.edu' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ description: 'Phone', example: '+15551234567' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class VanDto {
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

export class StudentListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by van ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  vanId?: string;

  @ApiPropertyOptional({ description: 'Filter by parent ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Search by name', example: 'Emma' })
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
