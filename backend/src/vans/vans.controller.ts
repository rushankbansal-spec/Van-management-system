// src/vans/vans.controller.ts
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
import { VansService } from './vans.service';
import {
  CreateVanDto,
  UpdateVanDto,
  VanDto,
  VanListQueryDto,
  AssignDriverDto,
} from './dto/vans.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ResourceOwnershipGuard } from '../common/guards/resource-ownership.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OwnsResource } from '../common/decorators/owns-resource.decorator';
import { UserWithSchool } from '../common/interfaces/auth.interface';

@ApiTags('Vans')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VansController {
  constructor(private readonly vansService: VansService) {}

  // Admin endpoints
  @Post('schools/:schoolId/vans')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new van (admin only)' })
  @ApiResponse({ status: 201, type: VanDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() createVanDto: CreateVanDto,
  ) {
    // Security: enforce school_id from JWT, not from URL param
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.vansService.create(schoolId, createVanDto);
  }

  @Get('schools/:schoolId/vans')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all vans in school (admin only)' })
  @ApiResponse({ status: 200, type: [VanDto] })
  async findAll(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
    @Query() query: VanListQueryDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.vansService.findAll(schoolId, query);
  }

  @Get('schools/:schoolId/vans/live')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get live GPS positions of all vans (admin only)' })
  @ApiResponse({ status: 200, type: [VanDto] })
  async findLive(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.vansService.findLive(schoolId);
  }

  @Get('schools/:schoolId/vans/:vanId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get van by ID (admin only)' })
  @ApiResponse({ status: 200, type: VanDto })
  @ApiResponse({ status: 404, description: 'Van not found' })
  async findOne(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('vanId', ParseUUIDPipe) vanId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.vansService.findOne(schoolId, vanId);
  }

  @Put('schools/:schoolId/vans/:vanId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update van (admin only)' })
  @ApiResponse({ status: 200, type: VanDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Van not found' })
  async update(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('vanId', ParseUUIDPipe) vanId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() updateVanDto: UpdateVanDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.vansService.update(schoolId, vanId, updateVanDto);
  }

  @Delete('schools/:schoolId/vans/:vanId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate van (admin only)' })
  @ApiResponse({ status: 204, description: 'Van deactivated' })
  @ApiResponse({ status: 404, description: 'Van not found' })
  async remove(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('vanId', ParseUUIDPipe) vanId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.vansService.remove(schoolId, vanId);
  }

  @Post('schools/:schoolId/vans/:vanId/driver')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Assign driver to van (admin only)' })
  @ApiResponse({ status: 200, type: VanDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Van or driver not found' })
  async assignDriver(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('vanId', ParseUUIDPipe) vanId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() assignDriverDto: AssignDriverDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.vansService.assignDriver(schoolId, vanId, assignDriverDto);
  }

  @Delete('schools/:schoolId/vans/:vanId/driver')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Unassign driver from van (admin only)' })
  @ApiResponse({ status: 200, type: VanDto })
  @ApiResponse({ status: 404, description: 'Van or driver not found' })
  async unassignDriver(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('vanId', ParseUUIDPipe) vanId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.vansService.unassignDriver(schoolId, vanId);
  }

  // Parent endpoints - can see their children's van
  @Get('students/:studentId/van/live')
  @ApiOperation({ summary: 'Get live location of student\'s van (parent only)' })
  @ApiResponse({ status: 200, type: VanDto })
  @ApiResponse({ status: 404, description: 'Student or van not found' })
  @OwnsResource()
  async getStudentVanLive(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    // Parent ownership check is handled by ResourceOwnershipGuard
    const van = await this.vansService.findVanForStudent(user.schoolId, studentId);
    if (!van) {
      throw new NotFoundException('Student or van not found');
    }
    return van;
  }
}
