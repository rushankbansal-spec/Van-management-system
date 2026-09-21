// src/drivers/drivers.service.ts
import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { CreateDriverDto, UpdateDriverDto, DriverDto, DriverListQueryDto } from './dto/drivers.dto';
import { createLogger } from '../common/logging/logger';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@generated/prisma';

@Injectable()
export class DriversService {
  private readonly logger = createLogger('DriversService');

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.argon2Options = {
      type: argon2.argon2id,
      memoryCost: parseInt(this.config.get('ARGON2_MEMORY_COST') || '65536', 10),
      timeCost: parseInt(this.config.get('ARGON2_TIME_COST') || '3', 10),
      parallelism: parseInt(this.config.get('ARGON2_PARALLELISM') || '4', 10),
    };
  }

  private argon2Options: argon2.Options;

  async create(schoolId: string, createDriverDto: CreateDriverDto): Promise<DriverDto> {
    // Check email uniqueness
    const existing = await this.prisma.user.findFirst({
      where: {
        schoolId,
        email: createDriverDto.email.toLowerCase(),
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(`User with email "${createDriverDto.email}" already exists in this school`);
    }

    // Hash password
    const passwordHash = await argon2.hash(createDriverDto.password, this.argon2Options);

    const user = await this.prisma.user.create({
      data: {
        schoolId,
        email: createDriverDto.email.toLowerCase(),
        passwordHash,
        firstName: createDriverDto.firstName,
        lastName: createDriverDto.lastName,
        phone: createDriverDto.phone,
        role: 'DRIVER',
        isActive: true,
      },
    });

    this.logger.log('Driver created', { 
      userId: user.id, 
      schoolId, 
      email: createDriverDto.email,
    });

    return this.toDto(user);
  }

  async findAll(schoolId: string, query: DriverListQueryDto): Promise<DriverDto[]> {
    const where: Prisma.UserWhereInput = {
      schoolId,
      role: 'DRIVER',
      deletedAt: null,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const drivers = await this.prisma.user.findMany({
      where,
      skip: query.skip,
      take: query.take || 50,
      orderBy: { lastName: 'asc' },
      include: {
        assignedVans: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
          take: 1,
        },
      },
    });

    return drivers.map(driver => this.toDto(driver));
  }

  async findOne(schoolId: string, driverId: string): Promise<DriverDto> {
    const driver = await this.prisma.user.findFirst({
      where: {
        id: driverId,
        schoolId,
        role: 'DRIVER',
        deletedAt: null,
      },
      include: {
        assignedVans: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver not found`);
    }

    return this.toDto(driver);
  }

  async update(schoolId: string, driverId: string, updateDriverDto: UpdateDriverDto): Promise<DriverDto> {
    const driver = await this.prisma.user.findFirst({
      where: {
        id: driverId,
        schoolId,
        role: 'DRIVER',
        deletedAt: null,
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id: driverId },
      data: {
        firstName: updateDriverDto.firstName,
        lastName: updateDriverDto.lastName,
        phone: updateDriverDto.phone,
        licenseNumber: (updateDriverDto as any).licenseNumber,
        licenseExpiry: (updateDriverDto as any).licenseExpiry,
        isActive: updateDriverDto.isActive,
      },
      include: {
        assignedVans: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
      },
    });

    this.logger.log('Driver updated', { 
      userId: driverId, 
      schoolId,
      name: `${updated.firstName} ${updated.lastName}`,
    });

    return this.toDto(updated);
  }

  async remove(schoolId: string, driverId: string): Promise<void> {
    const driver = await this.prisma.user.findFirst({
      where: {
        id: driverId,
        schoolId,
        role: 'DRIVER',
        deletedAt: null,
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver not found`);
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id: driverId },
      data: { 
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Unassign from any vans
    await this.prisma.van.updateMany({
      where: { driverId, schoolId },
      data: { driverId: null },
    });

    this.logger.log('Driver deactivated', { driverId, schoolId });
  }

  async findMe(user: { id: string; schoolId: string }): Promise<DriverDto> {
    const driver = await this.prisma.user.findFirst({
      where: {
        id: user.id,
        schoolId: user.schoolId,
        role: 'DRIVER',
        deletedAt: null,
      },
      include: {
        assignedVans: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver profile not found`);
    }

    return this.toDto(driver);
  }

  private toDto(user: any): DriverDto {
    const van = user.assignedVans?.[0];
    return {
      id: user.id,
      schoolId: user.schoolId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      licenseNumber: (user as any).licenseNumber,
      licenseExpiry: (user as any).licenseExpiry,
      role: user.role,
      isActive: user.isActive,
      van: van ? {
        id: van.id,
        name: van.name,
        plateNumber: van.plateNumber,
      } : undefined,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
