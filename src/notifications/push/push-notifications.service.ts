// src/notifications/push/push-notifications.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createLogger } from '../../common/logging/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PushNotificationsService
 * Firebase Cloud Messaging (FCM) integration for push notifications.
 * 
 * Abstracts FCM behind an interface so you can swap providers if needed.
 * Supports both service account JSON file and individual credential fields.
 */
@Injectable()
export class PushNotificationsService implements OnModuleInit {
  private readonly logger = createLogger('PushNotificationsService');
  private app: any = null; // FCM app instance
  private initialized = false;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    if (this.config.get('ENABLE_PUSH_NOTIFICATIONS') !== true) {
      this.logger.log('Push notifications disabled');
      return;
    }

    try {
      await this.initialize();
      this.initialized = true;
      this.logger.log('Push notifications initialized');
    } catch (error) {
      this.logger.error('Failed to initialize push notifications', {
        error: error.message,
      });
    }
  }

  private async initialize(): Promise<void> {
    const serviceAccountFile = this.config.get('FCM_SERVICE_ACCOUNT_FILE');
    
    if (serviceAccountFile && fs.existsSync(serviceAccountFile)) {
      // Initialize from service account file
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountFile, 'utf8'));
      this.app = await this.initFCMApp(serviceAccount);
    } else {
      // Initialize from individual fields
      const credentials = {
        projectId: this.config.get('FCM_PROJECT_ID'),
        privateKeyId: this.config.get('FCM_PRIVATE_KEY_ID'),
        privateKey: this.config.get('FCM_PRIVATE_KEY'),
        clientEmail: this.config.get('FCM_CLIENT_EMAIL'),
        clientId: this.config.get('FCM_CLIENT_ID'),
        authUri: this.config.get('FCM_AUTH_URI'),
        tokenUri: this.config.get('FCM_TOKEN_URI'),
        authProviderX509CertUrl: this.config.get('FCM_AUTH_PROVIDER_X509_CERT_URL'),
        clientX509CertUrl: this.config.get('FCM_CLIENT_X509_CERT_URL'),
      };

      // Filter out empty values
      Object.keys(credentials).forEach(key => {
        if (!credentials[key]) delete credentials[key];
      });

      if (Object.keys(credentials).length >= 3) {
        this.app = await this.initFCMApp(credentials);
      } else {
        throw new Error('FCM credentials not properly configured');
      }
    }
  }

  private async initFCMApp(credentials: any): Promise<any> {
    // In production, you'd use firebase-admin SDK:
    // const admin = require('firebase-admin');
    // admin.initializeApp({
    //   credential: admin.credential.cert(credentials),
    // });
    // return admin;

    // For now, return a mock that logs
    this.logger.log('FCM app initialized', {
      projectId: credentials.projectId,
    });

    return {
      messaging: {
        send: async (message: any) => {
          this.logger.debug('FCM message sent', {
            token: message.token?.substring(0, 20) + '...',
            title: message.notification?.title,
          });
          return { success: true };
        },
        sendMulticast: async (message: any) => {
          const count = (message.tokens || []).length;
          this.logger.debug('FCM multicast sent', {
            count,
          });
          return { successCount: count, failureCount: 0 };
        },
      },
    };
  }

  /**
   * Send a push notification to a specific user
   */
  async sendPushNotification(params: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    priority?: 'normal' | 'high';
    topic?: string;
    token?: string;
  }): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    if (!this.initialized || !this.app) {
      this.logger.warn('Push notifications not initialized, skipping');
      return { sent: false, error: 'Push notifications not initialized' };
    }

    try {
      const message = {
        token: params.token,
        topic: params.topic,
        notification: {
          title: params.title,
          body: params.body,
        },
        data: {
          userId: params.userId,
          ...params.data,
          sentAt: new Date().toISOString(),
        },
        android: {
          priority: params.priority === 'high' ? 'high' : 'normal',
          notification: {
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              priority: params.priority === 'high' ? '10' : '5',
            },
          },
        },
      };

      // Remove undefined values
      Object.keys(message).forEach(key => {
        if (message[key] === undefined) delete message[key];
      });

      const result = await this.app.messaging.send(message);
      
      this.logger.debug('Push notification sent', {
        userId: params.userId,
        title: params.title,
      });

      return {
        sent: true,
        messageId: result?.messageId,
      };
    } catch (error: any) {
      // Don't log the full error (may contain sensitive data)
      this.logger.error('Push notification failed', {
        userId: params.userId,
        error: error.message,
      });

      return {
        sent: false,
        error: error.message,
      };
    }
  }

  /**
   * Send push notification to multiple users (multicast)
   */
  async sendMulticastNotification(params: {
    userIds: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
    priority?: 'normal' | 'high';
  }): Promise<{ successCount: number; failureCount: number; results: any[] }> {
    if (!this.initialized || !this.app) {
      return { successCount: 0, failureCount: params.userIds.length, results: [] };
    }

    try {
      // In production, you'd resolve userIds to FCM tokens
      // For now, send to a topic or individual tokens
      const message = {
        tokens: params.userIds.map(id => `user_${id}_fcm_token`), // Placeholder
        notification: {
          title: params.title,
          body: params.body,
        },
        data: {
          ...params.data,
          sentAt: new Date().toISOString(),
        },
      };

      const result = await this.app.messaging.sendMulticast(message);
      
      this.logger.log('Multicast push notification sent', {
        userCount: params.userIds.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });

      return {
        successCount: result.successCount || 0,
        failureCount: result.failureCount || 0,
        results: [],
      };
    } catch (error: any) {
      this.logger.error('Multicast push notification failed', {
        error: error.message,
      });

      return {
        successCount: 0,
        failureCount: params.userIds.length,
        results: [],
      };
    }
  }

  /**
   * Subscribe a user to a topic (for broadcast notifications)
   */
  async subscribeToTopic(userId: string, topic: string): Promise<void> {
    if (!this.initialized || !this.app) {
      return;
    }

    try {
      const token = await this.getUserFcmToken(userId);
      if (token) {
        await this.app.messaging.subscribeToTopic(token, topic);
        this.logger.debug('User subscribed to topic', { userId, topic });
      }
    } catch (error) {
      this.logger.error('Failed to subscribe to topic', {
        userId,
        topic,
        error: error.message,
      });
    }
  }

  /**
   * Unsubscribe a user from a topic
   */
  async unsubscribeFromTopic(userId: string, topic: string): Promise<void> {
    if (!this.initialized || !this.app) {
      return;
    }

    try {
      const token = await this.getUserFcmToken(userId);
      if (token) {
        await this.app.messaging.unsubscribeFromTopic(token, topic);
        this.logger.debug('User unsubscribed from topic', { userId, topic });
      }
    } catch (error) {
      this.logger.error('Failed to unsubscribe from topic', {
        userId,
        topic,
        error: error.message,
      });
    }
  }

  /**
   * Get FCM token for a user (in production, stored in database)
   */
  private async getUserFcmToken(userId: string): Promise<string | null> {
    // In production, this would query a user_devices table
    // For now, return null to indicate token not found
    return null;
  }

  /**
   * Check if push notifications are available
   */
  isAvailable(): boolean {
    return this.initialized && this.app !== null;
  }
}
