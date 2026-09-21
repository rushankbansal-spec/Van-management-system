import { ConfigService } from "@nestjs/config";
// src/app.module.ts - Root application module
import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma/prisma.module';
import { RedisModule } from './database/redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { SchoolsModule } from './schools/schools.module';
import { VansModule } from './vans/vans.module';
import { DriversModule } from './drivers/drivers.module';
import { StudentsModule } from './students/students.module';
import { RoutesModule } from './routes/routes.module';
import { TripsModule } from './trips/trips.module';
import { AlertsModule } from './alerts/alerts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebSocketModule } from './websocket/websocket.module';
import { HealthModule } from './health/health.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { RolesGuard } from './common/guards/roles.guard';
import { ResourceOwnershipGuard } from './common/guards/resource-ownership.guard';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    SchoolsModule,
    VansModule,
    DriversModule,
    StudentsModule,
    RoutesModule,
    TripsModule,
    AlertsModule,
    NotificationsModule,
    WebSocketModule,
    HealthModule,
  ],
  providers: [
    // Global guards registered at module level
    RolesGuard,
    ResourceOwnershipGuard,
    // Middleware for tenant scoping
    {
      provide: 'TENANT_MIDDLEWARE',
      useClass: TenantMiddleware,
    },
  ],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Initialize any required setup
    console.log('🚐 School Van Tracker API initializing...');
  }

  async onModuleDestroy() {
    // Cleanup connections
    console.log('🚐 School Van Tracker API shutting down...');
  }
}
