// src/websocket/gateway/socket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RedisService } from '../../database/redis/redis.service';
import { WebSocketService } from '../services/websocket.service';
import { TripLocationService } from '../../trips/trip-location.service';
import { createLogger } from '../../common/logging/logger';
import { UserWithSchool } from '../../common/interfaces/auth.interface';

/**
 * SocketGateway
 * WebSocket gateway for real-time GPS tracking and notifications.
 * 
 * Handles:
 * - Driver GPS broadcasts (van:{vanId}:location topic)
 * - Parent/admin van location subscriptions
 * - Driver connection tracking for SOS
 * - Graceful reconnection with Redis state
 * 
 * Authentication: JWT token passed in handshake auth or first message
 */
@WebSocketGateway({
  namespace: 'tracking',
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',').join(' ') || '*',
    credentials: true,
  },
  // Ping/pong for connection health
  pingInterval: 30000,
  pingTimeout: 10000,
  // Max reconnection attempts
  maxHttpBufferSize: 1e6, // 1MB
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = createLogger('SocketGateway');

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
    private redis: RedisService,
    private webSocketService: WebSocketService,
    private tripLocationService: TripLocationService,
  ) {}

  // ========== Connection Handling ==========

  async handleConnection(client: Socket) {
    const startTime = Date.now();

    try {
      // Extract JWT from handshake auth
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('WebSocket connection without token', {
          clientId: client.id,
          ip: client.handshake.address,
        });
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = await this.verifyToken(token);

      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
          schoolId: payload.schoolId,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          schoolId: true,
          assignedVans: {
            select: { id: true },
            where: { isActive: true },
          },
          children: {
            select: { id: true },
            where: { isActive: true },
          },
        },
      });

      if (!user || !user.isActive) {
        this.logger.warn('WebSocket connection for invalid user', {
          clientId: client.id,
          userId: payload.sub,
        });
        client.disconnect();
        return;
      }

      // Store user info on socket
      const userWithSchool: UserWithSchool = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        schoolId: user.schoolId,
        ownedStudentIds: user.children?.map(c => c.id) || [],
        assignedVanIds: user.assignedVans?.map(v => v.id) || [],
        assignedTripIds: [],
      };

      (client as any).user = userWithSchool;

      // Track connection in Redis
      if (user.role === 'DRIVER') {
        // Store connection info in Redis for reconnection
        const vanId = await this.getDriverActiveVan(user.id);
        if (vanId) {
          await this.redis.setDriverConnection(user.id, client.id, vanId, user.schoolId);
          
          // Register in WebSocketService
          this.webSocketService.registerDriverConnection(user.id, client.id, vanId, user.schoolId);

          // Subscribe to van location broadcasts
          this.webSocketService.subscribeToVan(vanId, client.id);

          // Emit current van location
          const location = await this.redis.getVanLocation(vanId);
          if (location) {
            client.emit('van:location', {
              vanId,
              ...location,
            });
          }
        }
      }

      this.logger.log('WebSocket client connected', {
        clientId: client.id,
        userId: user.id,
        role: user.role,
        ip: client.handshake.address,
        duration: `${Date.now() - startTime}ms`,
      });

      // Send connection success
      client.emit('connected', {
        userId: user.id,
        role: user.role,
        schoolId: user.schoolId,
        connectedAt: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error('WebSocket connection error', {
        clientId: client.id,
        error: error.message,
      });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = (client as any).user as UserWithSchool | undefined;
    const startTime = Date.now();

    if (user) {
      // Clean up driver connection
      if (user.role === 'DRIVER') {
        const vanId = await this.getDriverActiveVan(user.id);
        if (vanId) {
          await this.redis.removeDriverConnection(client.id);
          this.webSocketService.unregisterDriverConnection(user.id, client.id);
          this.webSocketService.unsubscribeFromVan(vanId, client.id);
        }
      }

      this.logger.log('WebSocket client disconnected', {
        clientId: client.id,
        userId: user.id,
        role: user.role,
        duration: `${Date.now() - startTime}ms`,
      });
    } else {
      this.logger.warn('WebSocket client disconnected (no user context)', {
        clientId: client.id,
        ip: client.handshake.address,
      });
    }
  }

  // ========== Message Handlers ==========

  /**
   * Driver sends GPS location update
   * Topic: van:{vanId}:location
   */
  @SubscribeMessage('location')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { vanId: string; latitude: number; longitude: number; speed?: number; heading?: number; accuracy?: number },
  ) {
    const user = (client as any).user as UserWithSchool;

    if (!user || user.role !== 'DRIVER') {
      this.logger.warn('Non-driver attempted to send location', {
        clientId: client.id,
        userId: user?.id,
      });
      return;
    }

    // Verify driver is assigned to this van
    if (!user.assignedVanIds.includes(data.vanId)) {
      this.logger.warn('Driver sent location for unassigned van', {
        driverId: user.id,
        vanId: data.vanId,
      });
      return;
    }

    // Store in Redis
    await this.redis.setVanLocation(data.vanId, {
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      heading: data.heading,
      accuracy: data.accuracy,
    }, user.schoolId);

    // Update van in database (throttled in production)
    await this.tripLocationService.updateVanPosition(data.vanId, {
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      heading: data.heading,
    });

    // Broadcast to subscribers
    this.webSocketService.broadcastVanLocation(data.vanId, {
      ...data,
      updatedAt: Date.now(),
    });

    // Acknowledge receipt
    client.emit('location:ack', {
      vanId: data.vanId,
      receivedAt: new Date().toISOString(),
    });
  }

  /**
   * Driver subscribes to their van's location updates
   * (for reconnection scenarios)
   */
  @SubscribeMessage('subscribe:van')
  async handleSubscribeVan(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { vanId: string },
  ) {
    const user = (client as any).user as UserWithSchool;

    if (!user) {
      return;
    }

    // Verify user has access to this van
    if (user.role === 'DRIVER' && !user.assignedVanIds.includes(data.vanId)) {
      this.logger.warn('Driver subscribed to unassigned van', {
        driverId: user.id,
        vanId: data.vanId,
      });
      return;
    }

    if (user.role === 'PARENT') {
      // Parent can only subscribe to their children's vans
      const hasAccess = await this.canParentAccessVan(user.id, data.vanId);
      if (!hasAccess) {
        this.logger.warn('Parent subscribed to van without access', {
          parentId: user.id,
          vanId: data.vanId,
        });
        return;
      }
    }

    this.webSocketService.subscribeToVan(data.vanId, client.id);

    // Send current location if available
    const location = await this.redis.getVanLocation(data.vanId);
    if (location) {
      client.emit('van:location', {
        vanId: data.vanId,
        ...location,
      });
    }

    client.emit('subscribed:van', {
      vanId: data.vanId,
      subscribedAt: new Date().toISOString(),
    });
  }

  /**
   * Unsubscribe from van location updates
   */
  @SubscribeMessage('unsubscribe:van')
  async handleUnsubscribeVan(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { vanId: string },
  ) {
    this.webSocketService.unsubscribeFromVan(data.vanId, client.id);
    client.emit('unsubscribed:van', {
      vanId: data.vanId,
      unsubscribedAt: new Date().toISOString(),
    });
  }

  /**
   * Driver sends SOS signal
   */
  @SubscribeMessage('sos')
  async handleSOS(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { vanId: string; reason: string; tripId?: string },
  ) {
    const user = (client as any).user as UserWithSchool;

    if (!user || user.role !== 'DRIVER') {
      return;
    }

    // Verify driver is assigned to this van
    if (!user.assignedVanIds.includes(data.vanId)) {
      return;
    }

    // Broadcast SOS to all subscribers
    this.webSocketService.broadcastSOSAlert(data.vanId, data.tripId || '', undefined, data.reason);

    // Store SOS in database (handled by trips service via REST)
    // This WebSocket handler just broadcasts the alert

    client.emit('sos:ack', {
      vanId: data.vanId,
      acknowledgedAt: new Date().toISOString(),
    });

    this.logger.error('SOS signal received via WebSocket', {
      driverId: user.id,
      vanId: data.vanId,
      reason: data.reason,
    });
  }

  // ========== Private Helpers ==========

  private async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  private async getDriverActiveVan(driverId: string): Promise<string | null> {
    const connection = await this.redis.getDriverConnection(driverId);
    return connection?.vanId || null;
  }

  private async canParentAccessVan(parentId: string, vanId: string): Promise<boolean> {
    // Check if parent has any child assigned to this van
    const child = await this.prisma.student.findFirst({
      where: {
        parentId,
        vanId,
        isActive: true,
        deletedAt: null,
      },
    });

    return !!child;
  }
}
