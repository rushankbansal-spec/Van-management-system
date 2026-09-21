// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PushNotificationsService } from './push/push-notifications.service';

@Module({
  providers: [NotificationsService, PushNotificationsService],
  exports: [NotificationsService, PushNotificationsService],
})
export class NotificationsModule {}
