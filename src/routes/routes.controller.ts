// src/routes/routes.controller.ts
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
import { RoutesService } from './routes.service';
import { CreateRouteDto, UpdateRouteDto, RouteDto, RouteListQueryDto, CreateRouteStopDto } from './dto/routes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserWithSchool } from '../common/interfaces/auth.interface';

@ApiTags('Routes')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  // Admin endpoints
  @Post('schools/:schoolId/routes')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new route (admin only)' })
  @ApiResponse({ status: 201, type: RouteDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() createRouteDto: CreateRouteDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.routesService.create(schoolId, createRouteDto);
  }

  @Get('schools/:schoolId/routes')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all routes in school (admin only)' })
  @ApiResponse({ status: 200, type: [RouteDto] })
  async findAll(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
    @Query() query: RouteListQueryDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.routesService.findAll(schoolId, query);
  }

  @Get('schools/:schoolId/routes/:routeId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get route by ID (admin only)' })
  @ApiResponse({ status: 200, type: RouteDto })
  @ApiResponse({ status: 404, description: 'Route not found' })
  async findOne(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.routesService.findOne(schoolId, routeId);
  }

  @Put('schools/:schoolId/routes/:routeId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update route (admin only)' })
  @ApiResponse({ status: 200, type: RouteDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  async update(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() updateRouteDto: UpdateRouteDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.routesService.update(schoolId, routeId, updateRouteDto);
  }

  @Delete('schools/:schoolId/routes/:routeId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate route (admin only)' })
  @ApiResponse({ status: 204, description: 'Route deactivated' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  async remove(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.routesService.remove(schoolId, routeId);
  }

  @Get('schools/:schoolId/routes/:routeId/stops')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get route stops (admin only)' })
  @ApiResponse({ status: 200, type: [RouteStopDto] })
  async getStops(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.routesService.getStops(schoolId, routeId);
  }

  @Get('vans/:vanId/routes')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get routes assigned to a van (admin only)' })
  @ApiResponse({ status: 200, type: [RouteDto] })
  async getVanRoutes(
    @Param('vanId', ParseUUIDPipe) vanId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    const van = await this.routesService['prisma'].van.findUnique({
      where: { id: vanId },
      select: { schoolId: true },
    });
    if (!van) throw new NotFoundException('Van not found');
    if (user.schoolId !== van.schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.routesService.findRoutesForVan(user.schoolId, vanId);
  }

  @Post('schools/:schoolId/routes/:routeId/vans/:vanId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Assign van to route (admin only)' })
  @ApiResponse({ status: 204, description: 'Van assigned to route' })
  async assignVan(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Param('vanId', ParseUUIDPipe) vanId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() body: { isPrimary?: boolean },
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    await this.routesService.assignVan(schoolId, routeId, vanId, body.isPrimary || false);
  }

  @Delete('schools/:schoolId/routes/:routeId/vans/:vanId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unassign van from route (admin only)' })
  @ApiResponse({ status: 204, description: 'Van unassigned from route' })
  async unassignVan(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Param('vanId', ParseUUIDPipe) vanId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    await this.routesService.unassignVan(schoolId, routeId, vanId);
  }
}
