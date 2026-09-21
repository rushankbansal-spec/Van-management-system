// src/websocket/websocket.module.ts
import { Module } from '@nestjs/common';
import { SocketGateway } from './gateway/socket.gateway';
import { WebSocketService } from './services/websocket.service';
import { RedisModule } from '../database/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [SocketGateway, WebSocketService],
  exports: [SocketGateway, WebSocketService],
})
export class WebSocketModule {}
