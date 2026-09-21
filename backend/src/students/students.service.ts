// src/students/students.service.ts
import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto, StudentDto, StudentListQueryDto } from './dto/students.dto';
import { createLogger } from '../common/logging/logger';
import { Prisma } from '@generated/prisma';

@Injectable()
export class StudentsService {
  private readonly logger = createLogger('StudentsService');

  constructor(private prisma: PrismaService) {}

  async create(schoolId: string, createStudentDto: CreateStudentDto): Promise<StudentDto> {
    // Verify parent exists and is in the same school
    const parent = await this.prisma.user.findFirst({
      where: {
        id: createStudentDto.parentId,
        schoolId,
        role: 'PARENT',
        isActive: true,
        deletedAt: null,
      },
    });

    if (!parent) {
      throw new ConflictException(`Parent not found or not active in this school`);
    }

    // Verify van if provided
    if (createStudentDto.vanId) {
      const van = await this.prisma.van.findFirst({
        where: {
          id: createStudentDto.vanId,
          schoolId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!van) {
        throw new ConflictException(`Van not found or not active in this school`);
      }
    }

    const student = await this.prisma.student.create({
      data: {
        schoolId,
        firstName: createStudentDto.firstName,
        lastName: createStudentDto.lastName,
        dateOfBirth: createStudentDto.dateOfBirth ? new Date(createStudentDto.dateOfBirth) : null,
        gender: createStudentDto.gender,
        parentId: createStudentDto.parentId,
        vanId: createStudentDto.vanId || null,
        emergencyContactName: createStudentDto.emergencyContactName,
        emergencyContactPhone: createStudentDto.emergencyContactPhone,
        medicalInfo: createStudentDto.medicalInfo,
        photoUrl: createStudentDto.photoUrl,
        isActive: true,
      },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        currentVan: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
      },
    });

    this.logger.log('Student created', { 
      studentId: student.id, 
      schoolId, 
      name: `${student.firstName} ${student.lastName}`,
    });

    return this.toDto(student);
  }

  async findAll(schoolId: string, query: StudentListQueryDto): Promise<StudentDto[]> {
    const where: Prisma.StudentWhereInput = {
      schoolId,
      deletedAt: null,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.vanId && { vanId: query.vanId }),
      ...(query.parentId && { parentId: query.parentId }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const students = await this.prisma.student.findMany({
      where,
      skip: query.skip,
      take: query.take || 50,
      orderBy: { lastName: 'asc' },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        currentVan: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
      },
    });

    return students.map(student => this.toDto(student));
  }

  async findOne(schoolId: string, studentId: string): Promise<StudentDto> {
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId,
        deletedAt: null,
      },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        currentVan: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student not found`);
    }

    return this.toDto(student);
  }

  async update(schoolId: string, studentId: string, updateStudentDto: UpdateStudentDto): Promise<StudentDto> {
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!student) {
      throw new NotFoundException(`Student not found`);
    }

    // Verify van if being changed
    if (updateStudentDto.vanId && updateStudentDto.vanId !== student.vanId) {
      const van = await this.prisma.van.findFirst({
        where: {
          id: updateStudentDto.vanId,
          schoolId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!van) {
        throw new ConflictException(`Van not found or not active in this school`);
      }
    }

    // Update other students in the same van - remove from old van
    if (updateStudentDto.vanId && updateStudentDto.vanId !== student.vanId) {
      await this.prisma.student.updateMany({
        where: {
          schoolId,
          vanId: student.vanId,
          id: { not: studentId },
        },
        data: { vanId: null },
      });
    }

    const updated = await this.prisma.student.update({
      where: { id: studentId },
      data: {
        firstName: updateStudentDto.firstName,
        lastName: updateStudentDto.lastName,
        dateOfBirth: updateStudentDto.dateOfBirth ? new Date(updateStudentDto.dateOfBirth) : undefined,
        gender: updateStudentDto.gender,
        vanId: updateStudentDto.vanId,
        emergencyContactName: updateStudentDto.emergencyContactName,
        emergencyContactPhone: updateStudentDto.emergencyContactPhone,
        medicalInfo: updateStudentDto.medicalInfo,
        photoUrl: updateStudentDto.photoUrl,
        isActive: updateStudentDto.isActive,
      },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        currentVan: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
      },
    });

    this.logger.log('Student updated', { 
      studentId, 
      schoolId,
      name: `${updated.firstName} ${updated.lastName}`,
    });

    return this.toDto(updated);
  }

  async remove(schoolId: string, studentId: string): Promise<void> {
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!student) {
      throw new NotFoundException(`Student not found`);
    }

    // Soft delete
    await this.prisma.student.update({
      where: { id: studentId },
      data: { 
        isActive: false,
        deletedAt: new Date(),
        vanId: null, // Remove from van
      },
    });

    this.logger.log('Student deactivated', { studentId, schoolId });
  }

  async findForParent(schoolId: string, parentId: string): Promise<StudentDto[]> {
    const students = await this.prisma.student.findMany({
      where: {
        schoolId,
        parentId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        currentVan: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return students.map(student => this.toDto(student));
  }

  async findForVan(schoolId: string, vanId: string): Promise<StudentDto[]> {
    const students = await this.prisma.student.findMany({
      where: {
        schoolId,
        vanId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        currentVan: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return students.map(student => this.toDto(student));
  }

  async countForVan(schoolId: string, vanId: string): Promise<number> {
    return this.prisma.student.count({
      where: {
        schoolId,
        vanId,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  private toDto(student: any): StudentDto {
    const dob = student.dateOfBirth ? new Date(student.dateOfBirth) : null;
    const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined;

    return {
      id: student.id,
      schoolId: student.schoolId,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`,
      dateOfBirth: student.dateOfBirth?.toISOString().split('T')[0] || student.dateOfBirth,
      age,
      gender: student.gender,
      parent: {
        id: student.parent.id,
        name: `${student.parent.firstName} ${student.parent.lastName}`,
        email: student.parent.email,
        phone: student.parent.phone,
      },
      van: student.currentVan ? {
        id: student.currentVan.id,
        name: student.currentVan.name,
        plateNumber: student.currentVan.plateNumber,
      } : undefined,
      isActive: student.isActive,
      createdAt: student.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: student.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
