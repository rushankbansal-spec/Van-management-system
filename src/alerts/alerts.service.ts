// src/alerts/alerts.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { 
  CreateAlertDto, UpdateAlertDto, AlertDto, AlertListQueryDto, MarkReadDto,
  AlertType, AlertSeverity
} from './dto/alerts.dto';
import { createLogger } from '../common/logging/logger';
import { Prisma } from '@generated/prisma';

@Injectable()
export class AlertsService {
  private readonly logger = createLogger('AlertsService');

  constructor(private prisma: PrismaService) {}

  async create(schoolId: string, createAlertDto: CreateAlertDto): Promise<AlertDto> {
    const alert = await this.prisma.alert.create({
      data: {
        schoolId,
        type: createAlertDto.type,
        severity: createAlertDto.severity,
        vanId: createAlertDto.vanId,
        tripId: createAlertDto.tripId,
        studentId: createAlertDto.studentId,
        driverId: createAlertDto.driverId,
        userId: createAlertDto.userId,
        title: createAlertDto.title,
        message: createAlertDto.message,
        data: createAlertDto.data ?? undefined,
        isRead: false,
      },
    });

    // If alert type is SOS, also create push notification
    if (createAlertDto.type === AlertType.SOS) {
      // In production, this would trigger push notifications
      this.logger.error('SOS alert created, push notifications should be sent', {
        alertId: alert.id,
        schoolId,
        vanId: createAlertDto.vanId,
        tripId: createAlertDto.tripId,
      });
    }

    this.logger.log('Alert created', {
      alertId: alert.id,
      schoolId,
      type: createAlertDto.type,
      severity: createAlertDto.severity,
    });

    return this.toDto(alert);
  }

  async findAll(schoolId: string, query: AlertListQueryDto): Promise<AlertDto[]> {
    const where: Prisma.AlertWhereInput = {
      schoolId,
      ...(query.type && { type: query.type }),
      ...(query.severity && { severity: query.severity }),
      ...(query.vanId && { vanId: query.vanId }),
      ...(query.tripId && { tripId: query.tripId }),
      ...(query.studentId && { studentId: query.studentId }),
      ...(query.isRead !== undefined && { isRead: query.isRead }),
    };

    const alerts = await this.prisma.alert.findMany({
      where,
      skip: query.skip,
      take: query.take || 50,
      orderBy: [
        { severity: 'desc' }, // CRITICAL first
        { createdAt: 'desc' },
      ],
    });

    return alerts.map(alert => this.toDto(alert));
  }

  async findOne(schoolId: string, alertId: string): Promise<AlertDto> {
    const alert = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert not found`);
    }

    return this.toDto(alert);
  }

  async update(schoolId: string, alertId: string, updateAlertDto: UpdateAlertDto): Promise<AlertDto> {
    const alert = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert not found`);
    }

    const updateData: Prisma.AlertUpdateInput = {
      ...(updateAlertDto.severity && { severity: updateAlertDto.severity }),
      ...(updateAlertDto.title && { title: updateAlertDto.title }),
      ...(updateAlertDto.message && { message: updateAlertDto.message }),
      ...(updateAlertDto.data !== undefined && { data: updateAlertDto.data }),
    };

    if (updateAlertDto.isRead !== undefined) {
      updateData.isRead = updateAlertDto.isRead;
      updateData.readAt = updateAlertDto.isRead ? new Date() : null;
    }

    const updated = await this.prisma.alert.update({
      where: { id: alertId },
      data: updateData,
    });

    this.logger.log('Alert updated', {
      alertId,
      schoolId,
      isRead: updated.isRead,
    });

    return this.toDto(updated);
  }

  async markAsRead(schoolId: string, markReadDto: MarkReadDto): Promise<number> {
    const result = await this.prisma.alert.updateMany({
      where: {
        id: { in: markReadDto.alertIds },
        schoolId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    this.logger.log('Alerts marked as read', {
      schoolId,
      count: result.count,
      alertIds: markReadDto.alertIds,
    });

    return result.count;
  }

  async markAllAsRead(schoolId: string, userId?: string): Promise<number> {
    const where: Prisma.AlertWhereInput = {
      schoolId,
      isRead: false,
      ...(userId && { userId }),
    };

    const result = await this.prisma.alert.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    this.logger.log('All alerts marked as read', {
      schoolId,
      userId,
      count: result.count,
    });

    return result.count;
  }

  async getUnreadCount(schoolId: string, userId?: string): Promise<number> {
    const where: Prisma.AlertWhereInput = {
      schoolId,
      isRead: false,
      ...(userId && { userId }),
    };

    return this.prisma.alert.count({ where });
  }

  async remove(schoolId: string, alertId: string): Promise<void> {
    const alert = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert not found`);
    }

    // Soft delete
    await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        deletedAt: new Date(),
      },
    });

    this.logger.log('Alert deleted', { alertId, schoolId });
  }

  // Specialized methods for different alert types

  async createSOSAlert(
    schoolId: string,
    vanId: string,
    tripId: string,
    driverId: string,
    reason: string,
    location?: { latitude: number; longitude: number },
  ): Promise<AlertDto> {
    return this.create(schoolId, {
      type: AlertType.SOS,
      severity: AlertSeverity.CRITICAL,
      vanId,
      tripId,
      driverId,
      title: 'SOS Alert - Driver Emergency',
      message: `Driver activated SOS: ${reason}`,
      data: { location },
    });
  }

  async createDelayAlert(
    schoolId: string,
    vanId: string,
    tripId: string,
    delayMinutes: number,
    parentIds: string[],
  ): Promise<AlertDto[]> {
    const alert = await this.create(schoolId, {
      type: AlertType.DELAY,
      severity: AlertSeverity.MEDIUM,
      vanId,
      tripId,
      title: 'Pickup/Drop Delayed',
      message: `Van is running ${delayMinutes} minutes late`,
      data: { delayMinutes },
    });

    // In production, create individual alerts for each parent
    // For now, return the main alert
    return [alert];
  }

  private toDto(alert: any): AlertDto {
    return {
      id: alert.id,
      schoolId: alert.schoolId,
      type: alert.type,
      severity: alert.severity,
      vanId: alert.vanId,
      tripId: alert.tripId,
      studentId: alert.studentId,
      driverId: alert.driverId,
      userId: alert.userId,
      title: alert.title,
      message: alert.message,
      data: alert.data,
      isRead: alert.isRead,
      readAt: alert.readAt?.toISOString(),
      createdAt: alert.createdAt?.toISOString() || '',
      updatedAt: alert.updatedAt?.toISOString() || '',
    };
  }
}
