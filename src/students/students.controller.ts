// src/students/students.controller.ts
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
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, StudentDto, StudentListQueryDto } from './dto/students.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ResourceOwnershipGuard } from '../common/guards/resource-ownership.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OwnsResource } from '../common/decorators/owns-resource.decorator';
import { UserWithSchool } from '../common/interfaces/auth.interface';

@ApiTags('Students')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // Admin endpoints
  @Post('schools/:schoolId/students')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new student (admin only)' })
  @ApiResponse({ status: 201, type: StudentDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() createStudentDto: CreateStudentDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.studentsService.create(schoolId, createStudentDto);
  }

  @Get('schools/:schoolId/students')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all students in school (admin only)' })
  @ApiResponse({ status: 200, type: [StudentDto] })
  async findAll(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @CurrentUser() user: UserWithSchool,
    @Query() query: StudentListQueryDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.studentsService.findAll(schoolId, query);
  }

  @Get('schools/:schoolId/students/:studentId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get student by ID (admin only)' })
  @ApiResponse({ status: 200, type: StudentDto })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async findOne(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.studentsService.findOne(schoolId, studentId);
  }

  @Put('schools/:schoolId/students/:studentId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update student (admin only)' })
  @ApiResponse({ status: 200, type: StudentDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async update(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: UserWithSchool,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.studentsService.update(schoolId, studentId, updateStudentDto);
  }

  @Delete('schools/:schoolId/students/:studentId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate student (admin only)' })
  @ApiResponse({ status: 204, description: 'Student deactivated' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async remove(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== schoolId) {
      throw new Error('Cross-school access denied');
    }
    return this.studentsService.remove(schoolId, studentId);
  }

  // Parent endpoints - can only see own children
  @Get('parents/me/students')
  @UseGuards(RolesGuard)
  @Roles('PARENT')
  @ApiOperation({ summary: 'Get current parent\'s children' })
  @ApiResponse({ status: 200, type: [StudentDto] })
  async getMyChildren(@CurrentUser() user: UserWithSchool) {
    return this.studentsService.findForParent(user.schoolId, user.id);
  }

  @Get('parents/:parentId/students')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get parent\'s children (admin only)' })
  @ApiResponse({ status: 200, type: [StudentDto] })
  async getParentChildren(
    @Param('parentId', ParseUUIDPipe) parentId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== (await this.getParentSchoolId(parentId))) {
      throw new Error('Cross-school access denied');
    }
    return this.studentsService.findForParent(user.schoolId, parentId);
  }

  async getParentSchoolId(parentId: string): Promise<string> {
    const parent = await this.studentsService['prisma'].user.findUnique({
      where: { id: parentId },
      select: { schoolId: true },
    });
    if (!parent) throw new NotFoundException('Parent not found');
    return parent.schoolId;
  }

  // Student endpoints that require ownership
  @Get('students/:studentId')
  @OwnsResource()
  @ApiOperation({ summary: 'Get student details (parent or admin)' })
  @ApiResponse({ status: 200, type: StudentDto })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async getStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    // Parent ownership check handled by guard
    // Admin can access any student in their school
    return this.studentsService.findOne(user.schoolId, studentId);
  }

  @Get('students/:studentId/van')
  @OwnsResource()
  @ApiOperation({ summary: 'Get student\'s assigned van (parent or admin)' })
  @ApiResponse({ status: 200, type: StudentDto })
  @ApiResponse({ status: 404, description: 'Student or van not found' })
  async getStudentVan(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    const student = await this.studentsService.findOne(user.schoolId, studentId);
    if (!student.van) {
      throw new NotFoundException('Student has no assigned van');
    }
    return student;
  }

  @Get('vans/:vanId/students')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all students assigned to a van (admin only)' })
  @ApiResponse({ status: 200, type: [StudentDto] })
  async getVanStudents(
    @Param('vanId', ParseUUIDPipe) vanId: string,
    @CurrentUser() user: UserWithSchool,
  ) {
    if (user.schoolId !== (await this.getVanSchoolId(vanId))) {
      throw new Error('Cross-school access denied');
    }
    return this.studentsService.findForVan(user.schoolId, vanId);
  }

  async getVanSchoolId(vanId: string): Promise<string> {
    const van = await this.studentsService['prisma'].van.findUnique({
      where: { id: vanId },
      select: { schoolId: true },
    });
    if (!van) throw new NotFoundException('Van not found');
    return van.schoolId;
  }
}
