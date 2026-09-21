// src/trips/trips.module.ts
import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { TripLocationService } from './trip-location.service';
import { RedisModule } from '../database/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [TripsController],
  providers: [TripsService, TripLocationService],
  exports: [TripsService, TripLocationService],
})
export class TripsModule {}
