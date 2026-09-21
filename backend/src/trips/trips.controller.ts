// src/trips/trips.controller.ts
import {
  Controller,
  Get,
  Post,
  UseGuards,
  Body,
  Param,
  Query,
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
import { TripsService } from './trips.service';
import {
  CreateTripDto, StartTripDto, EndTripDto,
  MarkPickupDto, MarkAbsentDto, SosActivateDto, SosResolveDto,
  TripDto, TripWithDetailsDto, TripListQueryDto, TripHistoryQueryDto, TripLocationDto,
  TripType, PickupLogDto,
} from './dto/trips.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ResourceOwnershipGuard } from '../common/guards/resource-ownership.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OwnsResource } from '../common/decorators/owns-resource.decorator';
import { UserWithSchool } from '../common/interfaces/auth.interface';

@ApiTags('Trips')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  // ========== Admin Endpoints ==========
  
  @Post('schools/:schoolId/trips')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new trip (admin can create for any driver)' })
  @ApiResponse({ status: 201, type: TripDto })
  async create(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() createTripDto: CreateTripDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    // Admin creates trip and assigns to driver
    return this.tripsService.create(schoolId, createTripDto, createTripDto.driverId);
  }

  @Get('schools/:schoolId/trips')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all trips in school (admin only)' })
  @ApiResponse({ status: 200, type: [TripDto] })
  async findAll(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
    @Query() query: TripListQueryDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.tripsService.findAll(schoolId, query);
  }

  @Get('schools/:schoolId/trips/:tripId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get trip details (admin only)' })
  @ApiResponse({ status: 200, type: TripWithDetailsDto })
  async findOne(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.tripsService.findOne(schoolId, tripId);
  }

  @Get('students/:studentId/history')
  @OwnsResource()
  @ApiOperation({ summary: 'Get trip history for a student (parent only)' })
  @ApiResponse({ status: 200, type: [TripDto] })
  async getStudentHistory(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: UserWithSchool,
    @Query() query: TripHistoryQueryDto,
  ) {
    // Parent ownership check handled by guard, which validates studentId against user's children
    return this.tripsService.findHistory(user.schoolId, studentId, query);
  }

  @Get('students/:studentId/van/live')
  @OwnsResource()
  @ApiOperation({ summary: 'Get live location of student\'s van (parent only)' })
  @ApiResponse({ status: 200, type: TripLocationDto })
  async getStudentVanLive(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    // Parent ownership check handled by guard
    // Get student's assigned van
    const student = await this.tripsService['prisma'].student.findFirst({
      where: {
        id: studentId,
        schoolId: user.schoolId,
        deletedAt: null,
      },
      include: {
        currentVan: true,
      },
    });

    if (!student || !student.currentVan) {
      throw new NotFoundException(`Student has no assigned van`);
    }

    const location = await this.tripsService['redis'].getVanLocation(student.currentVan.id);
    if (!location) {
      throw new NotFoundException(`Van location not available`);
    }

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      speed: location.speed,
      heading: location.heading,
      accuracy: location.accuracy,
      updatedAt: location.updatedAt ? new Date(location.updatedAt).toISOString() : null,
    };
  }

  // ========== Driver Endpoints ==========

  @Post('trips')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Create a new trip (driver creates for their van)' })
  @ApiResponse({ status: 201, type: TripDto })
  async createTrip(
    @CurrentUser() user: UserWithSchool,
    @Body() createTripDto: CreateTripDto,
  ) {
    // Driver can only create trips for their assigned van
    if (!user.assignedVanIds.includes(createTripDto.vanId)) {
      throw new ForbiddenException(`You are not assigned to this van`);
    }
    return this.tripsService.create(user.schoolId, createTripDto, user.id);
  }

  @Get('drivers/me/trips')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  @ApiOperation({ summary: 'List driver\'s trips' })
  @ApiResponse({ status: 200, type: [TripDto] })
  async getMyTrips(
    @CurrentUser() user: UserWithSchool,
    @Query() query: TripListQueryDto,
  ) {
    query.driverId = user.id;
    return this.tripsService.findAll(user.schoolId, query);
  }

  @Get('drivers/me/trips/:tripId')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get driver\'s trip details' })
  @ApiResponse({ status: 200, type: TripWithDetailsDto })
  async getMyTrip(
    @CurrentUser() user: UserWithSchool,
    @Param('tripId', ParseUUIDPipe) tripId: string,
  ) {
    return this.tripsService.findOne(user.schoolId, tripId);
  }

  @Post('trips/:tripId/start')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Start a trip (driver only)' })
  @ApiResponse({ status: 200, type: TripDto })
  async startTrip(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() startTripDto: StartTripDto,
  ) {
    if (startTripDto.tripId !== tripId) {
      throw new BadRequestException('Trip ID mismatch');
    }
    return this.tripsService.startTrip(user.schoolId, startTripDto, user.id);
  }

  @Post('trips/:tripId/end')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  @ApiOperation({ summary: 'End a trip (driver only)' })
  @ApiResponse({ status: 200, type: TripDto })
  async endTrip(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() endTripDto: EndTripDto,
  ) {
    if (endTripDto.tripId !== tripId) {
      throw new BadRequestException('Trip ID mismatch');
    }
    return this.tripsService.endTrip(user.schoolId, endTripDto, user.id);
  }

  @Post('trips/:tripId/students/:studentId/pickup')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  @OwnsResource()
  @ApiOperation({ summary: 'Mark student picked up (driver only, idempotent)' })
  @ApiResponse({ status: 201, type: PickupLogDto })
  async markPickup(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() markPickupDto: MarkPickupDto,
  ) {
    if (markPickupDto.tripId !== tripId) {
      throw new BadRequestException('Trip ID mismatch');
    }
    if (markPickupDto.studentId !== studentId) {
      throw new BadRequestException('Student ID mismatch');
    }
    return this.tripsService.markPickup(user.schoolId, markPickupDto, user.id);
  }

  @Post('trips/:tripId/students/:studentId/drop')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  @OwnsResource()
  @ApiOperation({ summary: 'Mark student dropped off (driver only, idempotent)' })
  @ApiResponse({ status: 201, type: PickupLogDto })
  async markDrop(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() markPickupDto: MarkPickupDto,
  ) {
    if (markPickupDto.tripId !== tripId) {
      throw new BadRequestException('Trip ID mismatch');
    }
    if (markPickupDto.studentId !== studentId) {
      throw new BadRequestException('Student ID mismatch');
    }
    return this.tripsService.markDrop(user.schoolId, markPickupDto, user.id);
  }

  @Post('trips/:tripId/students/:studentId/absent')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  @OwnsResource()
  @ApiOperation({ summary: 'Mark student absent (driver only, idempotent)' })
  @ApiResponse({ status: 201, type: PickupLogDto })
  async markAbsent(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() markAbsentDto: MarkAbsentDto,
  ) {
    if (markAbsentDto.tripId !== tripId) {
      throw new BadRequestException('Trip ID mismatch');
    }
    if (markAbsentDto.studentId !== studentId) {
      throw new BadRequestException('Student ID mismatch');
    }
    return this.tripsService.markAbsent(user.schoolId, markAbsentDto, user.id);
  }

  @Post('trips/:tripId/sos')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Activate SOS alert (driver only)' })
  @ApiResponse({ status: 200, type: TripDto })
  async activateSOS(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() sosActivateDto: SosActivateDto,
  ) {
    if (sosActivateDto.tripId !== tripId) {
      throw new BadRequestException('Trip ID mismatch');
    }
    return this.tripsService.activateSOS(user.schoolId, sosActivateDto, user.id);
  }

  @Post('trips/:tripId/sos/resolve')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Resolve SOS alert (driver only)' })
  @ApiResponse({ status: 200, type: TripDto })
  async resolveSOS(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() sosResolveDto: SosResolveDto,
  ) {
    if (sosResolveDto.tripId !== tripId) {
      throw new BadRequestException('Trip ID mismatch');
    }
    return this.tripsService.resolveSOS(user.schoolId, sosResolveDto, user.id);
  }
}
