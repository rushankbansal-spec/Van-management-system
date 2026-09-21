// src/routes/routes.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { CreateRouteDto, UpdateRouteDto, RouteDto, RouteStopDto, RouteListQueryDto, CreateRouteStopDto } from './dto/routes.dto';
import { createLogger } from '../common/logging/logger';
import { Prisma } from '@generated/prisma';

@Injectable()
export class RoutesService {
  private readonly logger = createLogger('RoutesService');

  constructor(private prisma: PrismaService) {}

  async create(schoolId: string, createRouteDto: CreateRouteDto): Promise<RouteDto> {
    const route = await this.prisma.route.create({
      data: {
        schoolId,
        name: createRouteDto.name,
        description: createRouteDto.description,
        isActive: true,
      },
    });

    // Create stops if provided
    if (createRouteDto.stops && createRouteDto.stops.length > 0) {
      const stops = createRouteDto.stops.map((stop, index) => ({
        routeId: route.id,
        stopOrder: index + 1,
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        address: stop.address,
        estimatedArrival: stop.estimatedArrival,
      }));

      await this.prisma.routeStop.createMany({
        data: stops,
      });
    }

    const routeWithStops = await this.prisma.route.findUnique({
      where: { id: route.id },
      include: {
        stops: {
          orderBy: { stopOrder: 'asc' },
        },
        assignedVans: true,
      },
    });

    this.logger.log('Route created', { 
      routeId: route.id, 
      schoolId, 
      name: route.name,
    });

    return this.toDto(routeWithStops);
  }

  async findAll(schoolId: string, query: RouteListQueryDto): Promise<RouteDto[]> {
    const where: Prisma.RouteWhereInput = {
      schoolId,
      deletedAt: null,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        name: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const routes = await this.prisma.route.findMany({
      where,
      skip: query.skip,
      take: query.take || 50,
      orderBy: { name: 'asc' },
      include: {
        stops: {
          orderBy: { stopOrder: 'asc' },
        },
        assignedVans: {
          where: { isActive: true },
        },
      },
    });

    return routes.map(route => this.toDto(route));
  }

  async findOne(schoolId: string, routeId: string): Promise<RouteDto> {
    const route = await this.prisma.route.findFirst({
      where: {
        id: routeId,
        schoolId,
        deletedAt: null,
      },
      include: {
        stops: {
          orderBy: { stopOrder: 'asc' },
        },
        assignedVans: {
          where: { isActive: true },
        },
      },
    });

    if (!route) {
      throw new NotFoundException(`Route not found`);
    }

    return this.toDto(route);
  }

  async update(schoolId: string, routeId: string, updateRouteDto: UpdateRouteDto): Promise<RouteDto> {
    const route = await this.prisma.route.findFirst({
      where: {
        id: routeId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!route) {
      throw new NotFoundException(`Route not found`);
    }

    // Update route basic info
    const updated = await this.prisma.route.update({
      where: { id: routeId },
      data: {
        name: updateRouteDto.name,
        description: updateRouteDto.description,
        isActive: updateRouteDto.isActive,
      },
    });

    // Update stops if provided
    if (updateRouteDto.stops !== undefined) {
      // Delete existing stops
      await this.prisma.routeStop.deleteMany({
        where: { routeId },
      });

      // Create new stops
      if (updateRouteDto.stops.length > 0) {
        const stops = updateRouteDto.stops.map((stop, index) => ({
          routeId,
          stopOrder: index + 1,
          name: stop.name,
          latitude: stop.latitude,
          longitude: stop.longitude,
          address: stop.address,
          estimatedArrival: stop.estimatedArrival,
        }));

        await this.prisma.routeStop.createMany({
          data: stops,
        });
      }
    }

    const routeWithStops = await this.prisma.route.findUnique({
      where: { id: routeId },
      include: {
        stops: {
          orderBy: { stopOrder: 'asc' },
        },
        assignedVans: {
          where: { isActive: true },
        },
      },
    });

    this.logger.log('Route updated', { 
      routeId, 
      schoolId,
      name: routeWithStops?.name,
    });

    return this.toDto(routeWithStops);
  }

  async remove(schoolId: string, routeId: string): Promise<void> {
    const route = await this.prisma.route.findFirst({
      where: {
        id: routeId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!route) {
      throw new NotFoundException(`Route not found`);
    }

    // Soft delete
    await this.prisma.route.update({
      where: { id: routeId },
      data: { 
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Remove van-route assignments
    await this.prisma.vanRoute.deleteMany({
      where: { routeId },
    });

    this.logger.log('Route deactivated', { routeId, schoolId });
  }

  async getStops(schoolId: string, routeId: string): Promise<RouteStopDto[]> {
    const route = await this.prisma.route.findFirst({
      where: {
        id: routeId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!route) {
      throw new NotFoundException(`Route not found`);
    }

    const stops = await this.prisma.routeStop.findMany({
      where: { routeId },
      orderBy: { stopOrder: 'asc' },
    });

    return stops.map(stop => ({
      id: stop.id,
      stopOrder: stop.stopOrder,
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
      address: stop.address,
      estimatedArrival: stop.estimatedArrival,
    }));
  }

  async findRoutesForVan(schoolId: string, vanId: string): Promise<RouteDto[]> {
    const routes = await this.prisma.route.findMany({
      where: {
        schoolId,
        deletedAt: null,
        assignedVans: {
          some: {
            vanId,
          },
        },
      },
      include: {
        stops: {
          orderBy: { stopOrder: 'asc' },
        },
        assignedVans: {
          where: { isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return routes.map(route => this.toDto(route));
  }

  async assignVan(schoolId: string, routeId: string, vanId: string, isPrimary: boolean = false): Promise<void> {
    // Verify route exists
    const route = await this.prisma.route.findFirst({
      where: {
        id: routeId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!route) {
      throw new NotFoundException(`Route not found`);
    }

    // Verify van exists
    const van = await this.prisma.van.findFirst({
      where: {
        id: vanId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!van) {
      throw new NotFoundException(`Van not found`);
    }

    // Create or update van-route assignment
    await this.prisma.vanRoute.upsert({
      where: {
        vanId_routeId: {
          vanId,
          routeId,
        },
      },
      create: {
        vanId,
        routeId,
        isPrimary,
      },
      update: {
        isPrimary,
      },
    });

    this.logger.log('Van assigned to route', { 
      routeId, 
      vanId, 
      schoolId,
      isPrimary,
    });
  }

  async unassignVan(schoolId: string, routeId: string, vanId: string): Promise<void> {
    await this.prisma.vanRoute.deleteMany({
      where: {
        routeId,
        vanId,
      },
    });

    this.logger.log('Van unassigned from route', { routeId, vanId, schoolId });
  }

  private toDto(route: any): RouteDto {
    return {
      id: route.id,
      schoolId: route.schoolId,
      name: route.name,
      description: route.description,
      isActive: route.isActive,
      stops: route.stops?.map(stop => ({
        id: stop.id,
        stopOrder: stop.stopOrder,
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        address: stop.address,
        estimatedArrival: stop.estimatedArrival,
      })) || [],
      vanCount: route.assignedVans?.length || 0,
      createdAt: route.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: route.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
