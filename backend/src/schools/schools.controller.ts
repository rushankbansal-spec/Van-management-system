// src/schools/schools.controller.ts
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
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto, UpdateSchoolDto, SchoolDto, SchoolListQueryDto } from './dto/schools.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserWithSchool } from '../common/interfaces/auth.interface';

@ApiTags('Schools')
@Controller('schools')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new school' })
  @ApiResponse({ status: 201, type: SchoolDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async create(@Body() createSchoolDto: CreateSchoolDto) {
    return this.schoolsService.create(createSchoolDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all schools (admin only)' })
  @ApiResponse({ status: 200, type: [SchoolDto] })
  async findAll(@Query() query: SchoolListQueryDto) {
    return this.schoolsService.findAll({
      isActive: query.isActive,
      skip: query.skip,
      take: query.take,
      search: query.search,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user\'s school' })
  @ApiResponse({ status: 200, type: SchoolDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMySchool(@CurrentUser() user: UserWithSchool) {
    const school = await this.schoolsService.findOne(user.schoolId);
    return school;
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get school by ID (admin only)' })
  @ApiResponse({ status: 200, type: SchoolDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'School not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.findOne(id);
  }

  @Get('code/:code')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get school by code (admin only)' })
  @ApiResponse({ status: 200, type: SchoolDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'School not found' })
  async findByCode(@Param('code') code: string) {
    return this.schoolsService.findByCode(code);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update school (admin only)' })
  @ApiResponse({ status: 200, type: SchoolDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'School not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSchoolDto: UpdateSchoolDto,
  ) {
    return this.schoolsService.update(id, updateSchoolDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate school (admin only)' })
  @ApiResponse({ status: 204, description: 'School deactivated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'School not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.remove(id);
  }
}
