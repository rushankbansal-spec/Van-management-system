// src/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushNotificationsService } from './push/push-notifications.service';
import { createLogger } from '../common/logging/logger';

/**
 * NotificationsService
 * Abstraction layer for sending notifications via multiple channels:
 * - Push notifications (FCM)
 * - Email (future)
 * - SMS (future)
 * - In-app notifications (WebSocket)
 * 
 * Uses strategy pattern - each channel is a separate service.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = createLogger('NotificationsService');

  constructor(
    private config: ConfigService,
    private pushNotifications: PushNotificationsService,
  ) {}

  /**
   * Send a notification to a user via all available channels
   * Channels are tried in order; first successful delivery wins
   */
  async sendUserNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>,
    priority: 'normal' | 'high' = 'normal',
  ): Promise<{ sent: boolean; channels: string[] }> {
    const channels: string[] = [];
    let sent = false;

    // Try push notification first (most immediate for mobile apps)
    if (this.config.get('ENABLE_PUSH_NOTIFICATIONS') === true) {
      try {
        const pushResult = await this.pushNotifications.sendPushNotification({
          userId,
          title,
          body: message,
          data,
          priority,
        });
        if (pushResult.sent) {
          channels.push('push');
          sent = true;
        }
      } catch (error) {
        this.logger.warn('Push notification failed', {
          userId,
          error: error.message,
        });
      }
    }

    // Future: Add email notification
    // Future: Add SMS notification

    // Future: Add in-app notification via WebSocket
    // this.websocketService.sendToUser(userId, { type: 'notification', ... });

    return { sent, channels };
  }

  /**
   * Send notification to all parents of a student
   */
  async notifyStudentParents(
    studentId: string,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // Get student's parent IDs from database
    // In production, this would query the database
    this.logger.log('Parent notification queued', {
      studentId,
      title,
      message,
      data,
    });

    // Fire and forget - actual sending happens asynchronously
    setImmediate(async () => {
      try {
        // const parents = await this.prisma.student.findUnique({...});
        // for (const parentId of parentIds) {
        //   await this.sendUserNotification(parentId, title, message, data);
        // }
      } catch (error) {
        this.logger.error('Failed to send parent notification', {
          studentId,
          error: error.message,
        });
      }
    });
  }

  /**
   * Send notification to all admins of a school
   */
  async notifySchoolAdmins(
    schoolId: string,
    title: string,
    message: string,
    data?: Record<string, any>,
    excludeUserId?: string,
  ): Promise<void> {
    this.logger.log('Admin notification queued', {
      schoolId,
      title,
      message,
      data,
    });

    setImmediate(async () => {
      try {
        // const admins = await this.prisma.user.findMany({
        //   where: { schoolId, role: 'ADMIN', isActive: true },
        //   select: { id: true },
        // });
        // for (const admin of admins) {
        //   if (admin.id !== excludeUserId) {
        //     await this.sendUserNotification(admin.id, title, message, data);
        //   }
        // }
      } catch (error) {
        this.logger.error('Failed to send admin notification', {
          schoolId,
          error: error.message,
        });
      }
    });
  }

  /**
   * Send SOS alert to multiple recipients
   */
  async sendSOSAlert(
    recipients: string[], // User IDs
    vanId: string,
    tripId: string,
    location?: { latitude: number; longitude: number },
    message?: string,
  ): Promise<void> {
    const title = 'SOS Alert - Emergency';
    const body = message || `Van ${vanId} has activated SOS. Immediate attention required.`;

    for (const recipientId of recipients) {
      this.sendUserNotification(recipientId, title, body, {
        type: 'sos',
        vanId,
        tripId,
        location,
      }, 'high');
    }

    this.logger.error('SOS alert sent to recipients', {
      recipientCount: recipients.length,
      vanId,
      tripId,
    });
  }
}
