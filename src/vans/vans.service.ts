// src/vans/vans.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { RedisService } from '../database/redis/redis.service';
import { CreateVanDto, UpdateVanDto, VanDto, VanListQueryDto, AssignDriverDto } from './dto/vans.dto';
import { createLogger } from '../common/logging/logger';
import { Prisma } from '@generated/prisma';

@Injectable()
export class VansService {
  private readonly logger = createLogger('VansService');

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(schoolId: string, createVanDto: CreateVanDto): Promise<VanDto> {
    // Check for duplicate plate number in school
    const existing = await this.prisma.van.findFirst({
      where: {
        schoolId,
        plateNumber: createVanDto.plateNumber.toUpperCase(),
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(`Van with plate number "${createVanDto.plateNumber}" already exists in this school`);
    }

    // Validate driver assignment if provided
    if (createVanDto.driverId) {
      const driver = await this.prisma.user.findFirst({
        where: {
          id: createVanDto.driverId,
          schoolId,
          role: 'DRIVER',
          isActive: true,
          deletedAt: null,
        },
      });

      if (!driver) {
        throw new BadRequestException(`Driver not found or not active in this school`);
      }
    }

    const van = await this.prisma.van.create({
      data: {
        schoolId,
        name: createVanDto.name,
        plateNumber: createVanDto.plateNumber.toUpperCase(),
        capacity: createVanDto.capacity,
        make: createVanDto.make,
        model: createVanDto.model,
        year: createVanDto.year,
        color: createVanDto.color,
        driverId: createVanDto.driverId || null,
        isActive: true,
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        routes: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
      },
    });

    // Assign routes if provided
    if (createVanDto.routeIds && createVanDto.routeIds.length > 0) {
      await this.prisma.vanRoute.createMany({
        data: createVanDto.routeIds.map(routeId => ({
          vanId: van.id,
          routeId,
          isPrimary: false,
        })),
        skipDuplicates: true,
      });
    }

    this.logger.log('Van created', { 
      vanId: van.id, 
      schoolId, 
      plateNumber: van.plateNumber,
      name: van.name,
    });

    return this.toDto(van);
  }

  async findAll(schoolId: string, query: VanListQueryDto): Promise<VanDto[]> {
    const where: Prisma.VanWhereInput = {
      schoolId,
      deletedAt: null,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.driverId && { driverId: query.driverId }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { plateNumber: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const vans = await this.prisma.van.findMany({
      where,
      skip: query.skip,
      take: query.take || 50,
      orderBy: { name: 'asc' },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        routes: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
      },
    });

    // Get latest GPS positions from Redis in parallel
    const vanIds = vans.map(v => v.id);
    const gpsCache = await this.redis.getVanLocations(vanIds);
    
    return vans.map(van => {
      const gps = gpsCache.get(van.id);
      return this.toDto({ ...van, ...gps });
    });
  }

  async findOne(schoolId: string, vanId: string): Promise<VanDto> {
    const van = await this.prisma.van.findFirst({
      where: {
        id: vanId,
        schoolId,
        deletedAt: null,
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        routes: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
      },
    });

    if (!van) {
      throw new NotFoundException(`Van not found`);
    }

    // Get latest GPS position
    const gps = await this.redis.getVanLocation(vanId);
    
    return this.toDto({ ...van, ...gps });
  }

  async findLive(schoolId: string): Promise<VanDto[]> {
    // Get all active vans for the school
    const vans = await this.prisma.van.findMany({
      where: {
        schoolId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    if (vans.length === 0) {
      return [];
    }

    // Get all GPS positions from Redis
    const vanIds = vans.map(v => v.id);
    const gpsCache = await this.redis.getVanLocations(vanIds);

    // Build response with GPS data
    return vans.map(van => {
      const gps = gpsCache.get(van.id);
      return {
        id: van.id,
        schoolId: van.schoolId,
        name: van.name,
        plateNumber: van.plateNumber,
        capacity: van.capacity,
        make: van.make,
        model: van.model,
        year: van.year,
        color: van.color,
        isActive: van.isActive,
        currentLatitude: gps?.latitude,
        currentLongitude: gps?.longitude,
        currentSpeed: gps?.speed,
        currentHeading: gps?.heading,
        lastGpsUpdate: gps?.updatedAt ? new Date(gps.updatedAt).toISOString() : null,
        createdAt: van.createdAt?.toISOString() || '',
        updatedAt: van.updatedAt?.toISOString() || '',
      };
    });
  }

  async update(schoolId: string, vanId: string, updateVanDto: UpdateVanDto): Promise<VanDto> {
    // Verify van exists in school
    const existing = await this.prisma.van.findFirst({
      where: {
        id: vanId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Van not found`);
    }

    // Check plate number uniqueness if changing
    if (updateVanDto.plateNumber && updateVanDto.plateNumber !== existing.plateNumber) {
      const plateConflict = await this.prisma.van.findFirst({
        where: {
          schoolId,
          plateNumber: updateVanDto.plateNumber.toUpperCase(),
          id: { not: vanId },
          deletedAt: null,
        },
      });

      if (plateConflict) {
        throw new ConflictException(`Van with plate number "${updateVanDto.plateNumber}" already exists`);
      }
    }

    // Validate driver if provided
    if (updateVanDto.driverId) {
      const driver = await this.prisma.user.findFirst({
        where: {
          id: updateVanDto.driverId,
          schoolId,
          role: 'DRIVER',
          isActive: true,
          deletedAt: null,
        },
      });

      if (!driver) {
        throw new BadRequestException(`Driver not found or not active in this school`);
      }

      // Check if driver is already assigned to another van
      const driverVan = await this.prisma.van.findFirst({
        where: {
          schoolId,
          driverId: updateVanDto.driverId,
          id: { not: vanId },
          isActive: true,
          deletedAt: null,
        },
      });

      if (driverVan) {
        throw new BadRequestException(`Driver is already assigned to another van`);
      }
    }

    const van = await this.prisma.van.update({
      where: { id: vanId },
      data: {
        name: updateVanDto.name,
        plateNumber: updateVanDto.plateNumber?.toUpperCase(),
        capacity: updateVanDto.capacity,
        make: updateVanDto.make,
        model: updateVanDto.model,
        year: updateVanDto.year,
        color: updateVanDto.color,
        driverId: updateVanDto.driverId ?? existing.driverId,
        isActive: updateVanDto.isActive,
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        routes: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
      },
    });

    // Update routes if provided
    if (updateVanDto.routeIds !== undefined) {
      // Remove existing route assignments
      await this.prisma.vanRoute.deleteMany({
        where: { vanId },
      });

      // Add new route assignments
      if (updateVanDto.routeIds.length > 0) {
        await this.prisma.vanRoute.createMany({
          data: updateVanDto.routeIds.map(routeId => ({
            vanId,
            routeId,
            isPrimary: false,
          })),
          skipDuplicates: true,
        });
      }
    }

    this.logger.log('Van updated', { 
      vanId, 
      schoolId,
      name: van.name,
      plateNumber: van.plateNumber,
    });

    return this.toDto(van);
  }

  async remove(schoolId: string, vanId: string): Promise<void> {
    const existing = await this.prisma.van.findFirst({
      where: {
        id: vanId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Van not found`);
    }

    // Soft delete
    await this.prisma.van.update({
      where: { id: vanId },
      data: { 
        isActive: false,
        deletedAt: new Date(),
      },
    });

    this.logger.log('Van deactivated', { vanId, schoolId });
  }

  async assignDriver(schoolId: string, vanId: string, assignDriverDto: AssignDriverDto): Promise<VanDto> {
    const { driverId } = assignDriverDto;

    // Verify van exists
    const van = await this.prisma.van.findFirst({
      where: { id: vanId, schoolId, deletedAt: null },
    });

    if (!van) {
      throw new NotFoundException(`Van not found`);
    }

    // Verify driver exists and is in the same school
    const driver = await this.prisma.user.findFirst({
      where: {
        id: driverId,
        schoolId,
        role: 'DRIVER',
        isActive: true,
        deletedAt: null,
      },
    });

    if (!driver) {
      throw new BadRequestException(`Driver not found or not active in this school`);
    }

    // Check if driver is already assigned to another van
    const existingAssignment = await this.prisma.van.findFirst({
      where: {
        schoolId,
        driverId,
        id: { not: vanId },
        isActive: true,
        deletedAt: null,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(`Driver is already assigned to van "${existingAssignment.name}"`);
    }

    // Update van with driver
    const updatedVan = await this.prisma.van.update({
      where: { id: vanId },
      data: { driverId },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    this.logger.log('Driver assigned to van', { 
      vanId, 
      driverId, 
      schoolId,
    });

    return this.toDto(updatedVan);
  }

  async unassignDriver(schoolId: string, vanId: string): Promise<VanDto> {
    const van = await this.prisma.van.findFirst({
      where: { id: vanId, schoolId, deletedAt: null },
    });

    if (!van) {
      throw new NotFoundException(`Van not found`);
    }

    if (!van.driverId) {
      throw new BadRequestException(`Van has no driver assigned`);
    }

    const updatedVan = await this.prisma.van.update({
      where: { id: vanId },
      data: { driverId: null },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    this.logger.log('Driver unassigned from van', { vanId, schoolId });
    return this.toDto(updatedVan);
  }

  async findVanForStudent(schoolId: string, studentId: string): Promise<VanDto | null> {
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId,
        deletedAt: null,
      },
      include: {
        currentVan: {
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!student || !student.currentVan) {
      return null;
    }

    const van = student.currentVan;
    const gps = await this.redis.getVanLocation(van.id);

    return {
      id: van.id,
      schoolId: van.schoolId,
      name: van.name,
      plateNumber: van.plateNumber,
      capacity: van.capacity,
      make: van.make,
      model: van.model,
      year: van.year,
      color: van.color,
      driver: van.driver,
      isActive: van.isActive,
      currentLatitude: gps?.latitude,
      currentLongitude: gps?.longitude,
      currentSpeed: gps?.speed,
      currentHeading: gps?.heading,
      lastGpsUpdate: gps?.updatedAt ? new Date(gps.updatedAt).toISOString() : null,
      createdAt: van.createdAt?.toISOString() || '',
      updatedAt: van.updatedAt?.toISOString() || '',
    };
  }

  private toDto(van: any): VanDto {
    return {
      id: van.id,
      schoolId: van.schoolId,
      name: van.name,
      plateNumber: van.plateNumber,
      capacity: van.capacity,
      make: van.make,
      model: van.model,
      year: van.year,
      color: van.color,
      driver: van.driver ? {
        id: van.driver.id,
        name: `${van.driver.firstName} ${van.driver.lastName}`,
        email: van.driver.email,
        phone: van.driver.phone,
        role: van.driver.role,
      } : undefined,
      routes: van.routes?.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isActive: r.isActive,
      })),
      isActive: van.isActive,
      currentLatitude: van.currentLatitude,
      currentLongitude: van.currentLongitude,
      currentSpeed: van.currentSpeed,
      currentHeading: van.currentHeading,
      lastGpsUpdate: van.lastGpsUpdate?.toISOString() || van.lastGpsUpdate,
      createdAt: van.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: van.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
