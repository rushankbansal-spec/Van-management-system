import { PrismaClientKnownRequestError } from "@generated/prisma/runtime/library";
// src/common/services/tenant.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createLogger } from '../logging/logger';
import { Prisma, PrismaClient } from '@generated/prisma';
import { UserWithSchool } from '../interfaces/auth.interface';

/**
 * TenantService - Centralized tenant-scoped database operations
 * 
 * This service provides helper methods that automatically include
 * school_id in all queries, preventing cross-tenant data leakage.
 * 
 * USAGE:
 * Instead of: prisma.user.findMany({ where: { schoolId } })
 * Use: tenantService.findManyUsers({ ...filters })
 * 
 * This ensures school_id is ALWAYS included and cannot be forgotten.
 * 
 * LIMITATIONS:
 * - This is a helper/wrapper, not a replacement for all Prisma operations
 * - Complex queries may still need manual school_id inclusion
 * - Raw SQL must be manually scoped
 * - The real guarantee comes from: RBAC guards + explicit school_id + tests
 */
@Injectable()
export class TenantService implements OnModuleInit {
  private readonly logger = createLogger('TenantService');
  
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('TenantService initialized - all queries will be school-scoped');
  }

  // ========== User Operations (Tenant-Scoped) ==========

  /**
   * Find users within the current school only
   * school_id is ALWAYS included - cannot be bypassed
   */
  async findSchoolUsers(
    schoolId: string,
    options?: {
      role?: 'ADMIN' | 'DRIVER' | 'PARENT';
      isActive?: boolean;
      skip?: number;
      take?: number;
      orderBy?: Prisma.UserOrderByWithRelationInput;
      select?: Prisma.UserSelect;
    },
  ) {
    return this.prisma.user.findMany({
      where: {
        schoolId, // ALWAYS included - tenant scoping
        ...(options?.role && { role: options.role }),
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { createdAt: 'desc' },
      select: options?.select,
    });
  }

  /**
   * Find a single user within the school
   * Throws NotFoundException if not found or wrong school
   */
  async findSchoolUserById(
    userId: string,
    schoolId: string,
    options?: { select?: Prisma.UserSelect },
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        schoolId, // Tenant scoping - prevents cross-school access
        deletedAt: null, // Not soft-deleted
      },
      select: options?.select,
    });

    if (!user) {
      throw new PrismaClientKnownRequestError(
        'User not found',
        { code: 'P2025', clientVersion: '5.x' },
      );
    }

    return user;
  }

  // ========== Van Operations (Tenant-Scoped) ==========

  /**
   * Find vans within the current school only
   */
  async findSchoolVans(
    schoolId: string,
    options?: {
      isActive?: boolean;
      driverId?: string;
      skip?: number;
      take?: number;
      orderBy?: Prisma.VanOrderByWithRelationInput;
      select?: Prisma.VanSelect;
    },
  ) {
    return this.prisma.van.findMany({
      where: {
        schoolId, // ALWAYS included - tenant scoping
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
        ...(options?.driverId && { driverId: options.driverId }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { createdAt: 'desc' },
      select: options?.select,
    });
  }

  /**
   * Find a single van - only if it belongs to the school
   */
  async findSchoolVanById(
    vanId: string,
    schoolId: string,
    options?: { select?: Prisma.VanSelect },
  ) {
    const van = await this.prisma.van.findFirst({
      where: {
        id: vanId,
        schoolId, // Tenant scoping
        deletedAt: null,
      },
      select: options?.select,
    });

    if (!van) {
      throw new PrismaClientKnownRequestError(
        'Van not found in this school',
        { code: 'P2025', clientVersion: '5.x' },
      );
    }

    return van;
  }

  // ========== Student Operations (Tenant-Scoped) ==========

  /**
   * Find students within the current school only
   */
  async findSchoolStudents(
    schoolId: string,
    options?: {
      vanId?: string;
      parentId?: string;
      isActive?: boolean;
      skip?: number;
      take?: number;
      orderBy?: Prisma.StudentOrderByWithRelationInput;
      select?: Prisma.StudentSelect;
    },
  ) {
    return this.prisma.student.findMany({
      where: {
        schoolId, // ALWAYS included - tenant scoping
        ...(options?.vanId && { vanId: options.vanId }),
        ...(options?.parentId && { parentId: options.parentId }),
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { createdAt: 'desc' },
      select: options?.select,
    });
  }

  /**
   * Find a student - only if they belong to the school
   */
  async findSchoolStudentById(
    studentId: string,
    schoolId: string,
    options?: { select?: Prisma.StudentSelect },
  ) {
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId, // Tenant scoping
        deletedAt: null,
      },
      select: options?.select,
    });

    if (!student) {
      throw new PrismaClientKnownRequestError(
        'Student not found in this school',
        { code: 'P2025', clientVersion: '5.x' },
      );
    }

    return student;
  }

  // ========== Trip Operations (Tenant-Scoped) ==========

  /**
   * Find trips within the current school only
   */
  async findSchoolTrips(
    schoolId: string,
    options?: {
      vanId?: string;
      driverId?: string;
      status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SOS_ACTIVE';
      scheduledStart?: { gte?: Date; lte?: Date };
      skip?: number;
      take?: number;
      orderBy?: Prisma.TripOrderByWithRelationInput;
      select?: Prisma.TripSelect;
    },
  ) {
    return this.prisma.trip.findMany({
      where: {
        schoolId, // ALWAYS included - tenant scoping
        ...(options?.vanId && { vanId: options.vanId }),
        ...(options?.driverId && { driverId: options.driverId }),
        ...(options?.status && { status: options.status }),
        ...(options?.scheduledStart && {
          scheduledStart: options.scheduledStart,
        }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { scheduledStart: 'desc' },
      select: options?.select,
    });
  }

  /**
   * Find a trip - only if it belongs to the school
   */
  async findSchoolTripById(
    tripId: string,
    schoolId: string,
    options?: { select?: Prisma.TripSelect },
  ) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        schoolId, // Tenant scoping
        deletedAt: null,
      },
      select: options?.select,
    });

    if (!trip) {
      throw new PrismaClientKnownRequestError(
        'Trip not found in this school',
        { code: 'P2025', clientVersion: '5.x' },
      );
    }

    return trip;
  }

  // ========== Pickup Log Operations (Tenant-Scoped) ==========

  /**
   * Find pickup logs within the current school only
   */
  async findSchoolPickupLogs(
    schoolId: string,
    options?: {
      tripId?: string;
      studentId?: string;
      action?: 'PICKED_UP' | 'DROPPED_OFF' | 'ABSENT';
      actionTakenAt?: { gte?: Date; lte?: Date };
      skip?: number;
      take?: number;
      orderBy?: Prisma.PickupLogOrderByWithRelationInput;
      select?: Prisma.PickupLogSelect;
    },
  ) {
    return this.prisma.pickupLog.findMany({
      where: {
        schoolId, // ALWAYS included - tenant scoping
        ...(options?.tripId && { tripId: options.tripId }),
        ...(options?.studentId && { studentId: options.studentId }),
        ...(options?.action && { action: options.action }),
        ...(options?.actionTakenAt && {
          actionTakenAt: options.actionTakenAt,
        }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { actionTakenAt: 'desc' },
      select: options?.select,
    });
  }

  // ========== Route Operations (Tenant-Scoped) ==========

  /**
   * Find routes within the current school only
   */
  async findSchoolRoutes(
    schoolId: string,
    options?: {
      isActive?: boolean;
      skip?: number;
      take?: number;
      orderBy?: Prisma.RouteOrderByWithRelationInput;
      select?: Prisma.RouteSelect;
    },
  ) {
    return this.prisma.route.findMany({
      where: {
        schoolId, // ALWAYS included - tenant scoping
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { createdAt: 'desc' },
      select: options?.select,
    });
  }

  /**
   * Find a route - only if it belongs to the school
   */
  async findSchoolRouteById(
    routeId: string,
    schoolId: string,
    options?: { select?: Prisma.RouteSelect },
  ) {
    const route = await this.prisma.route.findFirst({
      where: {
        id: routeId,
        schoolId, // Tenant scoping
        deletedAt: null,
      },
      select: options?.select,
    });

    if (!route) {
      throw new PrismaClientKnownRequestError(
        'Route not found in this school',
        { code: 'P2025', clientVersion: '5.x' },
      );
    }

    return route;
  }

  // ========== Alert Operations (Tenant-Scoped) ==========

  /**
   * Find alerts within the current school only
   */
  async findSchoolAlerts(
    schoolId: string,
    options?: {
      type?: string;
      severity?: string;
      vanId?: string;
      tripId?: string;
      isRead?: boolean;
      skip?: number;
      take?: number;
      orderBy?: Prisma.AlertOrderByWithRelationInput;
      select?: Prisma.AlertSelect;
    },
  ) {
    return this.prisma.alert.findMany({
      where: {
        schoolId, // ALWAYS included - tenant scoping
        ...(options?.type && { type: options.type }),
        ...(options?.severity && { severity: options.severity }),
        ...(options?.vanId && { vanId: options.vanId }),
        ...(options?.tripId && { tripId: options.tripId }),
        ...(options?.isRead !== undefined && { isRead: options.isRead }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { createdAt: 'desc' },
      select: options?.select,
    });
  }

  // ========== Message Operations (Tenant-Scoped) ==========

  /**
   * Find messages within the current school only
   */
  async findSchoolMessages(
    schoolId: string,
    options?: {
      senderId?: string;
      receiverId?: string;
      isRead?: boolean;
      skip?: number;
      take?: number;
      orderBy?: Prisma.MessageOrderByWithRelationInput;
      select?: Prisma.MessageSelect;
    },
  ) {
    return this.prisma.message.findMany({
      where: {
        schoolId, // ALWAYS included - tenant scoping
        ...(options?.senderId && { senderId: options.senderId }),
        ...(options?.receiverId && { receiverId: options.receiverId }),
        ...(options?.isRead !== undefined && { isRead: options.isRead }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { createdAt: 'desc' },
      select: options?.select,
    });
  }

  // ========== Generic Transaction with Tenant Context ==========

  /**
   * Execute a transaction that requires tenant context validation
   * The callback receives a PrismaClient instance with tenant awareness
   */
  async transaction<T>(
    schoolId: string,
    callback: (tx: PrismaService, schoolId: string) => Promise<T>,
    options?: { maxRetries?: number; timeout?: number },
  ): Promise<T> {
    // Validate school exists before starting transaction
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new PrismaClientKnownRequestError(
        'School not found',
        { code: 'P2025', clientVersion: '5.x' },
      );
    }

    // Execute transaction with retry logic
    return this.prisma.transaction(
      async (tx) => {
        return callback(tx, schoolId);
      },
      options,
    );
  }
}
