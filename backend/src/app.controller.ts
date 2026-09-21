// src/app.controller.ts - Root controller with health endpoint
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health/health.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  @ApiResponse({ status: 503, description: 'API is unhealthy' })
  async healthCheck() {
    return this.healthService.check();
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({ status: 200, description: 'API is ready to serve traffic' })
  @ApiResponse({ status: 503, description: 'API is not ready' })
  async readinessCheck() {
    return this.healthService.readinessCheck();
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({ status: 200, description: 'API is alive' })
  async livenessCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
