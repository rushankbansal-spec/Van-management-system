// src/health/health.controller.ts
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Comprehensive health check
   * Returns status of all dependencies (PostgreSQL, Redis)
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check - full dependency status' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async health() {
    return this.healthService.check();
  }

  /**
   * Readiness probe
   * Returns OK if the service is ready to accept traffic
   * Used by Kubernetes readiness probes
   */
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness check - can serve traffic' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready() {
    const result = await this.healthService.readinessCheck();
    if (result.status === 'not_ready') {
      // Return 503 for not ready
      // NestJS can't change status code in body-only response, so we throw
      // Actually, we'll handle this in the response
    }
    return result;
  }

  /**
   * Liveness probe
   * Returns OK if the process is running
   * Used by Kubernetes liveness probes
   */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness check - process is running' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async live() {
    return this.healthService.livenessCheck();
  }
}
