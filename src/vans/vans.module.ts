// src/vans/vans.module.ts
import { Module } from '@nestjs/common';
import { VansController } from './vans.controller';
import { VansService } from './vans.service';
import { RedisModule } from '../database/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [VansController],
  providers: [VansService],
  exports: [VansService],
})
export class VansModule {}
