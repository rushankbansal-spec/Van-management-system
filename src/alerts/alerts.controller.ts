// src/alerts/alerts.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { 
  CreateAlertDto, UpdateAlertDto, AlertDto, AlertListQueryDto, MarkReadDto 
} from './dto/alerts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserWithSchool } from '../common/interfaces/auth.interface';

@ApiTags('Alerts')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  // Admin endpoints
  @Post('schools/:schoolId/alerts')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create an alert (admin only)' })
  @ApiResponse({ status: 201, type: AlertDto })
  async create(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() createAlertDto: CreateAlertDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.alertsService.create(schoolId, createAlertDto);
  }

  @Get('schools/:schoolId/alerts')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all alerts in school (admin only)' })
  @ApiResponse({ status: 200, type: [AlertDto] })
  async findAll(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
    @Query() query: AlertListQueryDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.alertsService.findAll(schoolId, query);
  }

  @Get('schools/:schoolId/alerts/:alertId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get alert by ID (admin only)' })
  @ApiResponse({ status: 200, type: AlertDto })
  async findOne(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('alertId', ParseUUIDPipe) alertId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.alertsService.findOne(schoolId, alertId);
  }

  @Put('schools/:schoolId/alerts/:alertId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update alert (admin only)' })
  @ApiResponse({ status: 200, type: AlertDto })
  async update(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('alertId', ParseUUIDPipe) alertId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() updateAlertDto: UpdateAlertDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.alertsService.update(schoolId, alertId, updateAlertDto);
  }

  @Delete('schools/:schoolId/alerts/:alertId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete alert (admin only)' })
  @ApiResponse({ status: 204, description: 'Alert deleted' })
  async remove(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('alertId', ParseUUIDPipe) alertId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.alertsService.remove(schoolId, alertId);
  }

  @Post('schools/:schoolId/alerts/read')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Mark alerts as read (admin only)' })
  @ApiResponse({ status: 200, description: 'Number of alerts marked as read' })
  async markAsRead(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() markReadDto: MarkReadDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    const count = await this.alertsService.markAsRead(schoolId, markReadDto);
    return { count };
  }

  @Get('schools/:schoolId/alerts/unread-count')
  @ApiOperation({ summary: 'Get unread alert count' })
  @ApiResponse({ status: 200, description: 'Number of unread alerts' })
  async getUnreadCount(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    const count = await this.alertsService.getUnreadCount(schoolId, user.id);
    return { count };
  }

  @Get('parents/me/alerts')
  @UseGuards(RolesGuard)
  @Roles('PARENT')
  @ApiOperation({ summary: 'Get parent\'s alerts' })
  @ApiResponse({ status: 200, type: [AlertDto] })
  async getMyAlerts(
    @CurrentUser() user: UserWithSchool,
    @Query() query: AlertListQueryDto,
  ) {
    query.userId = user.id;
    return this.alertsService.findAll(user.schoolId, query);
  }

  @Get('parents/me/alerts/unread-count')
  @UseGuards(RolesGuard)
  @Roles('PARENT')
  @ApiOperation({ summary: 'Get parent\'s unread alert count' })
  @ApiResponse({ status: 200, description: 'Number of unread alerts' })
  async getMyUnreadCount(@CurrentUser() user: UserWithSchool) {
    const count = await this.alertsService.getUnreadCount(user.schoolId, user.id);
    return { count };
  }
}
