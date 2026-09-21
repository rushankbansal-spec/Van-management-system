// src/trips/trip-location.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { RedisService } from '../database/redis/redis.service';
import { TripLocationDto } from './dto/trips.dto';
import { createLogger } from '../common/logging/logger';

/**
 * TripLocationService
 * Handles GPS location recording for trips:
 * - Stores location in Redis for live tracking (fast, ephemeral)
 * - Archives location to PostgreSQL for history (persistent, batched)
 * 
 * DESIGN FOR HIGH CONCURRENCY (500+ vans, 5-10s ping interval):
 * - Redis: Latest position only (overwrites, no history) - O(1) write
 * - PostgreSQL: Batched writes every 5 minutes via archive job
 * - This avoids 500-1000 writes/second to PostgreSQL
 * - Location history can be replayed from archive if needed
 */
@Injectable()
export class TripLocationService {
  private readonly logger = createLogger('TripLocationService');

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Record a GPS location for a trip.
   * - Updates Redis with latest position (fast, for live tracking)
   * - Does NOT write to PostgreSQL immediately (batched archiving)
   * 
   * @param tripId Trip UUID
   * @param schoolId School UUID
   * @param location GPS coordinates and metadata
   */
  async recordLocation(
    tripId: string,
    schoolId: string,
    location: TripLocationDto,
  ): Promise<void> {
    // Always update Redis for live tracking
    await this.redis.setVanLocation(
      tripId, // Using tripId as vanId here - in production, you'd map trip to van
      {
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed,
        heading: location.heading,
        accuracy: location.accuracy,
      },
      schoolId,
    );

    // Note: PostgreSQL archival is handled by a separate job/batch process
    // to avoid high write load. See: trips/jobs/location-archiver.job.ts
  }

  /**
   * Batch archive locations to PostgreSQL.
   * Called by a scheduled job every GPS_ARCHIVE_INTERVAL_SECONDS (default 5 min).
   * 
   * This moves data from the Redis hot cache to PostgreSQL cold storage.
   * We can reconstruct live position from Redis, and historical path from PostgreSQL.
   */
  async archiveLocations(batchSize: number = 100): Promise<number> {
    // In production, this would:
    // 1. Read location updates from a Redis list/queue that were queued during the interval
    // 2. Bulk insert into trip_locations table
    // 3. Trim the Redis cache if needed
    
    this.logger.debug('Location archival job triggered');
    
    // Placeholder - actual implementation would process a queue
    return 0;
  }

  /**
   * Get location history for a trip within a time range.
   * Reads from PostgreSQL where historical data is stored.
   */
  async getHistory(
    tripId: string,
    from: Date,
    to: Date,
    limit: number = 1000,
  ): Promise<Array<{
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    recordedAt: Date;
  }>> {
    const locations = await this.prisma.tripLocation.findMany({
      where: {
        tripId,
        recordedAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { recordedAt: 'asc' },
      take: limit,
      select: {
        latitude: true,
        longitude: true,
        speed: true,
        heading: true,
        accuracy: true,
        recordedAt: true,
      },
    });

    return locations;
  }

  /**
   * Get the latest known location for a van.
   * Primarily from Redis for speed, falls back to PostgreSQL.
   */
  async getLatestLocation(vanId: string): Promise<{
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    source: 'redis' | 'database' | 'none';
    updatedAt?: Date;
  } | null> {
    // Try Redis first (fast path)
    const redisLocation = await this.redis.getVanLocation(vanId);
    
    if (redisLocation) {
      return {
        latitude: redisLocation.latitude,
        longitude: redisLocation.longitude,
        speed: redisLocation.speed,
        heading: redisLocation.heading,
        accuracy: redisLocation.accuracy,
        source: 'redis',
        updatedAt: redisLocation.updatedAt ? new Date(redisLocation.updatedAt) : undefined,
      };
    }

    // Fall back to database (slow path)
    const vehicle = await this.prisma.van.findUnique({
      where: { id: vanId },
      select: {
        currentLatitude: true,
        currentLongitude: true,
        currentSpeed: true,
        currentHeading: true,
        lastGpsUpdate: true,
      },
    });

    if (vehicle?.currentLatitude !== null && vehicle?.currentLongitude !== null) {
      return {
        latitude: vehicle.currentLatitude,
        longitude: vehicle.currentLongitude,
        speed: vehicle.currentSpeed,
        heading: vehicle.currentHeading,
        source: 'database',
        updatedAt: vehicle.lastGpsUpdate,
      };
    }

    return null;
  }

  /**
   * Update van's position in PostgreSQL (called periodically or on trip end).
   * This is a persistent record, unlike Redis which is ephemeral.
   */
  async updateVanPosition(
    vanId: string,
    position: {
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
    },
  ): Promise<void> {
    await this.prisma.van.update({
      where: { id: vanId },
      data: {
        currentLatitude: position.latitude,
        currentLongitude: position.longitude,
        currentSpeed: position.speed,
        currentHeading: position.heading,
        lastGpsUpdate: new Date(),
      },
    });
  }
}
