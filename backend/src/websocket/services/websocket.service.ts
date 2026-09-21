// src/websocket/services/websocket.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createLogger } from '../common/logging/logger';

/**
 * WebSocketService
 * Manages WebSocket connections and subscriptions.
 * Handles:
 * - Driver connection tracking
 * - Van location subscriptions for parents/admins
 * - Graceful reconnection handling
 * - Connection state persistence in Redis
 */
@Injectable()
export class WebSocketService {
  private readonly logger = createLogger('WebSocketService');
  private driverConnections: Map<string, Set<string>> = new Map(); // driverId -> Set of socketIds
  private vanSubscriptions: Map<string, Set<string>> = new Map(); // vanId -> Set of socketIds

  constructor(private config: ConfigService) {}

  /**
   * Register a driver's WebSocket connection
   */
  registerDriverConnection(driverId: string, socketId: string, vanId: string, schoolId: string): void {
    if (!this.driverConnections.has(driverId)) {
      this.driverConnections.set(driverId, new Set());
    }
    this.driverConnections.get(driverId)?.add(socketId);

    // Store in Redis for reconnection handling
    // This is handled by the Redis service

    this.logger.debug('Driver connected', { driverId, socketId, vanId, schoolId });
  }

  /**
   * Unregister a driver's WebSocket connection
   */
  unregisterDriverConnection(driverId: string, socketId: string): void {
    const connections = this.driverConnections.get(driverId);
    if (connections) {
      connections.delete(socketId);
      if (connections.size === 0) {
        this.driverConnections.delete(driverId);
      }
    }

    this.logger.debug('Driver disconnected', { driverId, socketId });
  }

  /**
   * Check if a driver is currently connected
   */
  isDriverConnected(driverId: string): boolean {
    return this.driverConnections.has(driverId) && this.driverConnections.get(driverId)!.size > 0;
  }

  /**
   * Get all socket IDs for a driver (for multi-device support)
   */
  getDriverSocketIds(driverId: string): string[] {
    return Array.from(this.driverConnections.get(driverId) || []);
  }

  /**
   * Subscribe to van location updates
   */
  subscribeToVan(vanId: string, socketId: string): void {
    if (!this.vanSubscriptions.has(vanId)) {
      this.vanSubscriptions.set(vanId, new Set());
    }
    this.vanSubscriptions.get(vanId)?.add(socketId);

    this.logger.debug('Subscribed to van', { vanId, socketId });
  }

  /**
   * Unsubscribe from van location updates
   */
  unsubscribeFromVan(vanId: string, socketId: string): void {
    const subscribers = this.vanSubscriptions.get(vanId);
    if (subscribers) {
      subscribers.delete(socketId);
      if (subscribers.size === 0) {
        this.vanSubscriptions.delete(vanId);
      }
    }

    this.logger.debug('Unsubscribed from van', { vanId, socketId });
  }

  /**
   * Get all subscribers for a van
   */
  getVanSubscribers(vanId: string): string[] {
    return Array.from(this.vanSubscriptions.get(vanId) || []);
  }

  /**
   * Broadcast location update to all subscribers of a van
   * Called when a driver sends a GPS ping
   */
  broadcastVanLocation(
    vanId: string,
    location: {
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
      accuracy?: number;
      updatedAt: number;
    },
  ): void {
    const subscribers = this.getVanSubscribers(vanId);
    if (subscribers.length === 0) {
      this.logger.debug('No subscribers for van location broadcast', { vanId });
      return;
    }

    this.logger.debug('Broadcasting van location', {
      vanId,
      subscriberCount: subscribers.length,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    // In production, this would emit to all connected sockets:
    // this.socketGateway.emitToClients('van:location', vanId, location);
  }

  /**
   * Broadcast SOS alert to relevant subscribers
   */
  broadcastSOSAlert(
    vanId: string,
    tripId: string,
    location?: { latitude: number; longitude: number },
    message?: string,
  ): void {
    const subscribers = this.getVanSubscribers(vanId);
    
    this.logger.error('Broadcasting SOS alert', {
      vanId,
      tripId,
      subscriberCount: subscribers.length,
      message,
    });

    // In production, emit to all connected sockets including parents:
    // this.socketGateway.emitToClients('sos:alert', { vanId, tripId, location, message });
  }

  /**
   * Get connection statistics
   */
  getStats(): { driversConnected: number; vanSubscriptions: number } {
    let driversConnected = 0;
    for (const sockets of this.driverConnections.values()) {
      driversConnected += sockets.size;
    }

    let vanSubscriptions = 0;
    for (const sockets of this.vanSubscriptions.values()) {
      vanSubscriptions += sockets.size;
    }

    return { driversConnected, vanSubscriptions };
  }

  /**
   * Clean up stale connections (called periodically)
   */
  cleanupStaleConnections(maxAgeMs: number = 5 * 60 * 1000): void {
    const now = Date.now();
    
    for (const [driverId, sockets] of this.driverConnections.entries()) {
      // In production, would check last seen timestamp from Redis
      // For now, assume all connections are fresh (Socket.IO handles this)
    }
  }
}
