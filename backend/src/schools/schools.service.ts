// src/schools/schools.service.ts
import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { Prisma } from '@generated/prisma';
import { CreateSchoolDto, UpdateSchoolDto, SchoolDto } from './dto/schools.dto';
import { createLogger } from '../common/logging/logger';

@Injectable()
export class SchoolsService {
  private readonly logger = createLogger('SchoolsService');

  constructor(private prisma: PrismaService) {}

  async create(createSchoolDto: CreateSchoolDto): Promise<SchoolDto> {
    // Check if school code already exists
    const existing = await this.prisma.school.findUnique({
      where: { code: createSchoolDto.code },
    });

    if (existing) {
      throw new ConflictException(`School with code "${createSchoolDto.code}" already exists`);
    }

    const school = await this.prisma.school.create({
      data: {
        name: createSchoolDto.name,
        code: createSchoolDto.code.toUpperCase(),
        address: createSchoolDto.address,
        phone: createSchoolDto.phone,
        email: createSchoolDto.email,
        timezone: createSchoolDto.timezone || 'UTC',
        isActive: true,
      },
    });

    this.logger.log('School created', { schoolId: school.id, name: school.name });
    return this.toDto(school);
  }

  async findAll(options?: { isActive?: boolean; skip?: number; take?: number; search?: string }): Promise<SchoolDto[]> {
    const where: Prisma.SchoolWhereInput = {
      ...(options?.isActive !== undefined && { isActive: options.isActive }),
      ...(options?.search && {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { code: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    const schools = await this.prisma.school.findMany({
      where,
      skip: options?.skip,
      take: options?.take || 50,
      orderBy: { name: 'asc' },
    });

    return schools.map(school => this.toDto(school));
  }

  async findOne(id: string): Promise<SchoolDto> {
    const school = await this.prisma.school.findUnique({
      where: { id },
    });

    if (!school) {
      throw new NotFoundException(`School not found`);
    }

    return this.toDto(school);
  }

  async findByCode(code: string): Promise<SchoolDto> {
    const school = await this.prisma.school.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!school) {
      throw new NotFoundException(`School with code "${code}" not found`);
    }

    return this.toDto(school);
  }

  async update(id: string, updateSchoolDto: UpdateSchoolDto): Promise<SchoolDto> {
    // Check if school exists
    const existing = await this.prisma.school.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`School not found`);
    }

    // Check if code is being changed to an existing code
    if (updateSchoolDto.code && updateSchoolDto.code !== existing.code) {
      const codeConflict = await this.prisma.school.findUnique({
        where: { code: updateSchoolDto.code.toUpperCase() },
      });
      if (codeConflict) {
        throw new ConflictException(`School with code "${updateSchoolDto.code}" already exists`);
      }
    }

    const school = await this.prisma.school.update({
      where: { id },
      data: {
        name: updateSchoolDto.name,
        code: updateSchoolDto.code?.toUpperCase(),
        address: updateSchoolDto.address,
        phone: updateSchoolDto.phone,
        email: updateSchoolDto.email,
        timezone: updateSchoolDto.timezone,
        isActive: updateSchoolDto.isActive,
      },
    });

    this.logger.log('School updated', { schoolId: school.id, name: school.name });
    return this.toDto(school);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.school.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`School not found`);
    }

    // Soft delete by setting isActive to false
    // Hard delete would require cascading to all related records
    await this.prisma.school.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log('School deactivated', { schoolId: id });
  }

  private toDto(school: any): SchoolDto {
    return {
      id: school.id,
      name: school.name,
      code: school.code,
      address: school.address,
      phone: school.phone,
      email: school.email,
      timezone: school.timezone,
      isActive: school.isActive,
      createdAt: school.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: school.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
