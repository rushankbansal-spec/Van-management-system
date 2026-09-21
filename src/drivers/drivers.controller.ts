// src/drivers/drivers.controller.ts
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
import { IsObject, Max, MaxLength, Min, MinLength } from 'class-validator';
import { DriversService } from './drivers.service';
import { CreateDriverDto, UpdateDriverDto, DriverDto, DriverListQueryDto } from './dto/drivers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ResourceOwnershipGuard } from '../common/guards/resource-ownership.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OwnsResource } from '../common/decorators/owns-resource.decorator';
import { UserWithSchool } from '../common/interfaces/auth.interface';

@ApiTags('Drivers')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  // Admin endpoints
  @Post('schools/:schoolId/drivers')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new driver (admin only)' })
  @ApiResponse({ status: 201, type: DriverDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() createDriverDto: CreateDriverDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.driversService.create(schoolId, createDriverDto);
  }

  @Get('schools/:schoolId/drivers')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all drivers in school (admin only)' })
  @ApiResponse({ status: 200, type: [DriverDto] })
  async findAll(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
    @Query() query: DriverListQueryDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.driversService.findAll(schoolId, query);
  }

  @Get('schools/:schoolId/drivers/:driverId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get driver by ID (admin only)' })
  @ApiResponse({ status: 200, type: DriverDto })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async findOne(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.driversService.findOne(schoolId, driverId);
  }

  @Put('schools/:schoolId/drivers/:driverId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update driver (admin only)' })
  @ApiResponse({ status: 200, type: DriverDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async update(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() updateDriverDto: UpdateDriverDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.driversService.update(schoolId, driverId, updateDriverDto);
  }

  @Delete('schools/:schoolId/drivers/:driverId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate driver (admin only)' })
  @ApiResponse({ status: 204, description: 'Driver deactivated' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async remove(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.driversService.remove(schoolId, driverId);
  }

  // Driver own profile
  @Get('drivers/me')
  @ApiOperation({ summary: 'Get current driver profile' })
  @ApiResponse({ status: 200, type: DriverDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Driver role required' })
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  async getMe(@CurrentUser() user: UserWithSchool) {
    return this.driversService.findMe(user);
  }

  // Parent can view drivers of their children's van
  @Get('students/:studentId/van/driver')
  @OwnsResource()
  @ApiOperation({ summary: 'Get driver of student\'s van (parent only)' })
  @ApiResponse({ status: 200, type: DriverDto })
  @ApiResponse({ status: 404, description: 'Student, van, or driver not found' })
  async getStudentVanDriver(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    // Get student with van and driver
    const student = await this.driversService['prisma'].student.findFirst({
      where: {
        id: studentId,
        schoolId: user.schoolId,
        deletedAt: null,
      },
      include: {
        currentVan: {
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                licenseNumber: true,
                licenseExpiry: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!student || !student.currentVan || !student.currentVan.driver) {
      throw new NotFoundException('Student, van, or driver not found');
    }

    const driver = student.currentVan.driver;
    return {
      id: driver.id,
      schoolId: driver.schoolId,
      email: driver.email,
      firstName: driver.firstName,
      lastName: driver.lastName,
      fullName: `${driver.firstName} ${driver.lastName}`,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      role: driver.role,
      isActive: driver.isActive,
      createdAt: driver.createdAt?.toISOString() || '',
      updatedAt: driver.updatedAt?.toISOString() || '',
    };
  }
}
