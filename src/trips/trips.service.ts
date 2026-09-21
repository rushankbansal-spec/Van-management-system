// src/trips/trips.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { RedisService } from '../database/redis/redis.service';
import { TripLocationService } from './trip-location.service';
import { 
  CreateTripDto, StartTripDto, EndTripDto, 
  MarkPickupDto, MarkAbsentDto, SosActivateDto, SosResolveDto,
  TripDto, TripWithDetailsDto, TripListQueryDto, TripHistoryQueryDto, TripLocationDto,
  TripType, TripStatus, PickupLogDto
} from './dto/trips.dto';
import { createLogger } from '../common/logging/logger';
import { Prisma } from '@generated/prisma';

@Injectable()
export class TripsService {
  private readonly logger = createLogger('TripsService');

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private tripLocationService: TripLocationService,
  ) {}

  async create(schoolId: string, createTripDto: CreateTripDto, driverId: string): Promise<TripDto> {
    // Verify van belongs to school
    const van = await this.prisma.van.findFirst({
      where: {
        id: createTripDto.vanId,
        schoolId,
        isActive: true,
        driverId,
        deletedAt: null,
      },
    });

    if (!van) {
      throw new NotFoundException(`Van not found or not assigned to this driver`);
    }

    // Verify route if provided
    if (createTripDto.routeId) {
      const route = await this.prisma.route.findFirst({
        where: {
          id: createTripDto.routeId,
          schoolId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!route) {
        throw new NotFoundException(`Route not found`);
      }
    }

    const trip = await this.prisma.trip.create({
      data: {
        schoolId,
        vanId: createTripDto.vanId,
        routeId: createTripDto.routeId || null,
        driverId,
        tripType: createTripDto.tripType,
        status: 'NOT_STARTED',
        scheduledStart: new Date(createTripDto.scheduledStart),
        expectedDurationMinutes: createTripDto.expectedDurationMinutes,
        startLatitude: createTripDto.startLocation?.latitude,
        startLongitude: createTripDto.startLocation?.longitude,
        endLatitude: createTripDto.endLocation?.latitude,
        endLongitude: createTripDto.endLocation?.longitude,
        notes: createTripDto.notes,
      },
    });

    // Set active trip in Redis
    await this.redis.setActiveTrip(trip.id, van.id, schoolId);

    this.logger.log('Trip created', { 
      tripId: trip.id, 
      schoolId, 
      vanId: van.id, 
      tripType: trip.tripType,
    });

    return this.toDto(trip);
  }

  async findAll(schoolId: string, query: TripListQueryDto): Promise<TripDto[]> {
    const where: Prisma.TripWhereInput = {
      schoolId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.vanId && { vanId: query.vanId }),
      ...(query.driverId && { driverId: query.driverId }),
      ...(query.tripType && { tripType: query.tripType }),
      ...(query.from && query.to && {
        scheduledStart: {
          gte: new Date(query.from),
          lte: new Date(query.to),
        },
      }),
    };

    const trips = await this.prisma.trip.findMany({
      where,
      skip: query.skip,
      take: query.take || 50,
      orderBy: { scheduledStart: 'desc' },
      include: {
        van: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        route: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get pickup counts
    const tripIds = trips.map(t => t.id);
    const pickupCounts = await this.prisma.pickupLog.groupBy({
      by: ['tripId'],
      where: { tripId: { in: tripIds } },
      _count: { tripId: true },
    });

    const countMap = new Map(pickupCounts.map(p => [p.tripId, p._count.tripId]));

    return trips.map(trip => ({
      ...this.toDto(trip),
      pickupCount: countMap.get(trip.id) || 0,
    }));
  }

  async findOne(schoolId: string, tripId: string): Promise<TripWithDetailsDto> {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        schoolId,
        deletedAt: null,
      },
      include: {
        van: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        route: {
          select: {
            id: true,
            name: true,
          },
        },
        pickupLogs: {
          where: { deletedAt: null },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip not found`);
    }

    // Get latest location
    const latestLocation = trip.status === 'IN_PROGRESS' 
      ? await this.redis.getVanLocation(trip.vanId)
      : null;

    const pickupLogCount = trip.pickupLogs?.filter(l => l.deletedAt === null).length || 0;

    return {
      ...this.toDto(trip),
      van: trip.van,
      driver: trip.driver,
      route: trip.route,
      pickupLogCount,
      latestLocation,
    };
  }

  async findHistory(schoolId: string, studentId: string, query: TripHistoryQueryDto): Promise<TripDto[]> {
    // Verify student belongs to school
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!student) {
      throw new NotFoundException(`Student not found`);
    }

    // Find trips that include this student via pickup logs
    const trips = await this.prisma.trip.findMany({
      where: {
        schoolId,
        deletedAt: null,
        pickupLogs: {
          some: {
            studentId,
            deletedAt: null,
          },
        },
        scheduledStart: {
          gte: new Date(query.from),
          lte: new Date(query.to || query.from),
        },
      },
      skip: query.skip,
      take: query.take || 50,
      orderBy: { scheduledStart: 'desc' },
      include: {
        van: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return trips.map(trip => this.toDto(trip));
  }

  async findWithLocation(schoolId: string, tripId: string): Promise<{ trip: TripDto; location: TripLocationDto | null }> {
    const trip = await this.findOne(schoolId, tripId);
    const location = trip.status === 'IN_PROGRESS' 
      ? await this.redis.getVanLocation(trip.vanId)
      : null;
    
    return { trip: this.toDto(trip), location };
  }

  async startTrip(schoolId: string, startTripDto: StartTripDto, driverId: string): Promise<TripDto> {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: startTripDto.tripId,
        schoolId,
        driverId,
        status: 'NOT_STARTED',
        deletedAt: null,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip not found or not in NOT_STARTED status`);
    }

    const updateData: Prisma.TripUpdateInput = {
      status: 'IN_PROGRESS',
      actualStart: new Date(),
      startLatitude: startTripDto.location.latitude,
      startLongitude: startTripDto.location.longitude,
    };

    const updatedTrip = await this.prisma.trip.update({
      where: { id: trip.id },
      data: updateData,
    });

    // Update Redis with van location
    await this.redis.setVanLocation(trip.vanId, startTripDto.location, schoolId);

    // Create initial location record
    await this.tripLocationService.recordLocation(trip.id, schoolId, startTripDto.location);

    this.logger.log('Trip started', { 
      tripId: trip.id, 
      schoolId, 
      vanId: trip.vanId,
      location: startTripDto.location,
    });

    return this.toDto(updatedTrip);
  }

  async endTrip(schoolId: string, endTripDto: EndTripDto, driverId: string): Promise<TripDto> {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: endTripDto.tripId,
        schoolId,
        driverId,
        status: 'IN_PROGRESS',
        deletedAt: null,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip not found or not in IN_PROGRESS status`);
    }

    const updateData: Prisma.TripUpdateInput = {
      status: 'COMPLETED',
      actualEnd: new Date(),
      endLatitude: endTripDto.location.latitude,
      endLongitude: endTripDto.location.longitude,
      notes: endTripDto.notes,
    };

    const updatedTrip = await this.prisma.trip.update({
      where: { id: trip.id },
      data: updateData,
    });

    // Update Redis with final van location
    await this.redis.setVanLocation(trip.vanId, endTripDto.location, schoolId);

    // Record final location
    await this.tripLocationService.recordLocation(trip.id, schoolId, endTripDto.location);

    // Remove active trip from Redis
    await this.redis.removeActiveTrip(trip.id);

    this.logger.log('Trip completed', { 
      tripId: trip.id, 
      schoolId, 
      vanId: trip.vanId,
    });

    return this.toDto(updatedTrip);
  }

  async markPickup(schoolId: string, markPickupDto: MarkPickupDto, driverId: string): Promise<PickupLogDto> {
    // Verify trip exists and is in progress
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: markPickupDto.tripId,
        schoolId,
        driverId,
        status: 'IN_PROGRESS',
        deletedAt: null,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip not found or not in IN_PROGRESS status`);
    }

    // Verify student belongs to school and is on this trip's van
    const student = await this.prisma.student.findFirst({
      where: {
        id: markPickupDto.studentId,
        schoolId,
        vanId: trip.vanId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!student) {
      throw new BadRequestException(`Student not found or not assigned to this van`);
    }

    // Check for duplicate pickup/drop for this student on this trip
    const existingLog = await this.prisma.pickupLog.findFirst({
      where: {
        tripId: trip.id,
        studentId: student.id,
        action: { in: ['PICKED_UP', 'DROPPED_OFF'] },
        deletedAt: null,
      },
    });

    if (existingLog) {
      throw new ConflictException(`Student has already been picked up/dropped on this trip`);
    }

    // Check idempotency
    if (markPickupDto.idempotencyKey) {
      const existingIdempotent = await this.prisma.pickupLog.findFirst({
        where: {
          idempotencyKey: markPickupDto.idempotencyKey,
          deletedAt: null,
        },
      });

      if (existingIdempotent) {
        this.logger.log('Idempotent request - returning existing log', {
          idempotencyKey: markPickupDto.idempotencyKey,
        });
        return this.toPickupLogDto(existingIdempotent);
      }
    }

    // Perform in transaction
    const pickupLog = await this.prisma.$transaction(async (tx) => {
      // Create pickup log
      const log = await tx.pickupLog.create({
        data: {
          schoolId,
          tripId: trip.id,
          studentId: student.id,
          action: 'PICKED_UP',
          idempotencyKey: markPickupDto.idempotencyKey || null,
          latitude: markPickupDto.location.latitude,
          longitude: markPickupDto.location.longitude,
          verifiedBy: driverId,
          notes: markPickupDto.notes,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          trip: {
            select: {
              vanId: true,
            },
          },
        },
      });

      return log;
    });

    // Update van's current location in Redis
    await this.redis.setVanLocation(trip.vanId, markPickupDto.location, schoolId);

    // Record location history
    await this.tripLocationService.recordLocation(trip.id, schoolId, markPickupDto.location);

    // Notify parent via push notification (async, non-blocking)
    this.notifyParent(student.id, trip.vanId, 'PICKUP');

    this.logger.log('Pickup marked', {
      tripId: trip.id,
      studentId: student.id,
      schoolId,
      driverId,
    });

    return this.toPickupLogDto(pickupLog);
  }

  async markDrop(schoolId: string, markPickupDto: MarkPickupDto, driverId: string): Promise<PickupLogDto> {
    // Verify trip exists and is in progress
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: markPickupDto.tripId,
        schoolId,
        driverId,
        status: 'IN_PROGRESS',
        deletedAt: null,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip not found or not in IN_PROGRESS status`);
    }

    // Verify student belongs to school and is on this trip's van
    const student = await this.prisma.student.findFirst({
      where: {
        id: markPickupDto.studentId,
        schoolId,
        vanId: trip.vanId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!student) {
      throw new BadRequestException(`Student not found or not assigned to this van`);
    }

    // Check for duplicate pickup/drop for this student on this trip
    const existingLog = await this.prisma.pickupLog.findFirst({
      where: {
        tripId: trip.id,
        studentId: student.id,
        action: { in: ['PICKED_UP', 'DROPPED_OFF'] },
        deletedAt: null,
      },
    });

    if (existingLog) {
      throw new ConflictException(`Student already picked up/dropped on this trip`);
    }

    // Check idempotency
    if (markPickupDto.idempotencyKey) {
      const existingIdempotent = await this.prisma.pickupLog.findFirst({
        where: {
          idempotencyKey: markPickupDto.idempotencyKey,
          deletedAt: null,
        },
      });

      if (existingIdempotent) {
        this.logger.log('Idempotent request - returning existing log', {
          idempotencyKey: markPickupDto.idempotencyKey,
        });
        return this.toPickupLogDto(existingIdempotent);
      }
    }

    // Perform in transaction
    const pickupLog = await this.prisma.$transaction(async (tx) => {
      const log = await tx.pickupLog.create({
        data: {
          schoolId,
          tripId: trip.id,
          studentId: student.id,
          action: 'DROPPED_OFF',
          idempotencyKey: markPickupDto.idempotencyKey || null,
          latitude: markPickupDto.location.latitude,
          longitude: markPickupDto.location.longitude,
          verifiedBy: driverId,
          notes: markPickupDto.notes,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          trip: {
            select: {
              vanId: true,
            },
          },
        },
      });

      return log;
    });

    // Update van's current location in Redis
    await this.redis.setVanLocation(trip.vanId, markPickupDto.location, schoolId);

    // Record location history
    await this.tripLocationService.recordLocation(trip.id, schoolId, markPickupDto.location);

    // Notify parent via push notification (async, non-blocking)
    this.notifyParent(student.id, trip.vanId, 'DROP');

    this.logger.log('Drop marked', {
      tripId: trip.id,
      studentId: student.id,
      schoolId,
      driverId,
    });

    return this.toPickupLogDto(pickupLog);
  }

  async markAbsent(schoolId: string, markAbsentDto: MarkAbsentDto, driverId: string): Promise<PickupLogDto> {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: markAbsentDto.tripId,
        schoolId,
        driverId,
        status: 'IN_PROGRESS',
        deletedAt: null,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip not found or not in IN_PROGRESS status`);
    }

    const student = await this.prisma.student.findFirst({
      where: {
        id: markAbsentDto.studentId,
        schoolId,
        vanId: trip.vanId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!student) {
      throw new BadRequestException(`Student not found or not assigned to this van`);
    }

    const existingLog = await this.prisma.pickupLog.findFirst({
      where: {
        tripId: trip.id,
        studentId: student.id,
        action: { in: ['PICKED_UP', 'DROPPED_OFF'] },
        deletedAt: null,
      },
    });

    if (existingLog) {
      throw new ConflictException(`Student already picked up/dropped on this trip`);
    }

    const pickupLog = await this.prisma.pickupLog.create({
      data: {
        schoolId,
        tripId: trip.id,
        studentId: student.id,
        action: 'ABSENT',
        idempotencyKey: markAbsentDto.idempotencyKey || null,
        verifiedBy: driverId,
        notes: markAbsentDto.reason,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log('Absence marked', {
      tripId: trip.id,
      studentId: student.id,
      schoolId,
    });

    return this.toPickupLogDto(pickupLog);
  }

  async activateSOS(schoolId: string, sosActivateDto: SosActivateDto, driverId: string): Promise<TripDto> {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: sosActivateDto.tripId,
        schoolId,
        driverId,
        status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
        deletedAt: null,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip not found or not in active status`);
    }

    const updateData: Prisma.TripUpdateInput = {
      status: 'SOS_ACTIVE',
      sosActivated: true,
      sosActivatedAt: new Date(),
      sosReason: sosActivateDto.reason,
    };

    if (sosActivateDto.location) {
      updateData.startLatitude = sosActivateDto.location.latitude;
      updateData.startLongitude = sosActivateDto.location.longitude;
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id: trip.id },
      data: updateData,
    });

    // Update van location in Redis
    if (sosActivateDto.location) {
      await this.redis.setVanLocation(trip.vanId, sosActivateDto.location, schoolId);
    }

    // Create SOS alert
    await this.prisma.alert.create({
      data: {
        schoolId,
        type: 'SOS',
        severity: 'CRITICAL',
        vanId: trip.vanId,
        tripId: trip.id,
        driverId,
        title: 'SOS Alert - Driver Emergency',
        message: `Driver activated SOS: ${sosActivateDto.reason}`,
        data: {
          tripId: trip.id,
          vanId: trip.vanId,
          location: sosActivateDto.location,
        },
      },
    });

    this.logger.error('SOS activated', {
      tripId: trip.id,
      schoolId,
      driverId,
      reason: sosActivateDto.reason,
    });

    return this.toDto(updatedTrip);
  }

  async resolveSOS(schoolId: string, sosResolveDto: SosResolveDto, driverId: string): Promise<TripDto> {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: sosResolveDto.tripId,
        schoolId,
        driverId,
        status: 'SOS_ACTIVE',
        deletedAt: null,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip not found or not in SOS_ACTIVE status`);
    }

    const updateData: Prisma.TripUpdateInput = {
      status: sosResolveDto.willContinue ? 'IN_PROGRESS' : 'COMPLETED',
      sosResolvedAt: new Date(),
      notes: `${trip.notes || ''}${sosResolveDto.notes ? '; ' + sosResolveDto.notes : ''}`.trim(),
    };

    if (!sosResolveDto.willContinue) {
      updateData.actualEnd = new Date();
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id: trip.id },
      data: updateData,
    });

    // Create resolution alert
    await this.prisma.alert.create({
      data: {
        schoolId,
        type: 'SOS_RESOLVED',
        severity: 'LOW',
        vanId: trip.vanId,
        tripId: trip.id,
        driverId,
        title: 'SOS Resolved',
        message: `SOS has been resolved. ${sosResolveDto.notes || 'Trip continuing.'}`,
      },
    });

    this.logger.log('SOS resolved', {
      tripId: trip.id,
      schoolId,
      willContinue: sosResolveDto.willContinue,
    });

    return this.toDto(updatedTrip);
  }

  private notifyParent(studentId: string, vanId: string, action: 'PICKUP' | 'DROP'): void {
    // Fire and forget - notification service handles the actual push
    // This is async and non-blocking
    // In production, you'd use a message queue for reliability
    setImmediate(async () => {
      try {
        // Get student's parent
        const student = await this.prisma.student.findUnique({
          where: { id: studentId },
          select: { parentId: true },
        });

        if (student?.parentId) {
          // Get parent's FCM token (stored in a separate table or user profile)
          // For now, log that notification should be sent
          this.logger.log('Parent notification queued', {
            parentId: student.parentId,
            studentId,
            vanId,
            action,
          });
          // await this.notificationService.sendPushNotification(...)
        }
      } catch (error) {
        this.logger.error('Failed to queue parent notification', {
          studentId,
          vanId,
          action,
          error: error.message,
        });
      }
    });
  }

  private toDto(trip: any): TripDto {
    return {
      id: trip.id,
      schoolId: trip.schoolId,
      vanId: trip.vanId,
      routeId: trip.routeId,
      driverId: trip.driverId,
      tripType: trip.tripType,
      status: trip.status,
      scheduledStart: trip.scheduledStart?.toISOString() || '',
      actualStart: trip.actualStart?.toISOString(),
      actualEnd: trip.actualEnd?.toISOString(),
      expectedDurationMinutes: trip.expectedDurationMinutes,
      startLocation: trip.startLatitude && trip.startLongitude ? {
        latitude: trip.startLatitude,
        longitude: trip.startLongitude,
      } : undefined,
      endLocation: trip.endLatitude && trip.endLongitude ? {
        latitude: trip.endLatitude,
        longitude: trip.endLongitude,
      } : undefined,
      sosActivated: trip.sosActivated,
      sosActivatedAt: trip.sosActivatedAt?.toISOString(),
      sosResolvedAt: trip.sosResolvedAt?.toISOString(),
      sosReason: trip.sosReason,
      notes: trip.notes,
      pickupCount: 0, // Will be populated by caller
      createdAt: trip.createdAt?.toISOString() || '',
      updatedAt: trip.updatedAt?.toISOString() || '',
    };
  }

  private toPickupLogDto(log: any): PickupLogDto {
    return {
      id: log.id,
      tripId: log.tripId,
      studentId: log.studentId,
      studentName: log.student ? `${log.student.firstName} ${log.student.lastName}` : '',
      action: log.action,
      actionTakenAt: log.actionTakenAt?.toISOString() || '',
      location: log.latitude && log.longitude ? {
        latitude: log.latitude,
        longitude: log.longitude,
      } : undefined,
      notes: log.notes,
      verifiedBy: log.verifiedBy ? {
        id: log.verifiedBy,
      } : undefined,
    };
  }
}
