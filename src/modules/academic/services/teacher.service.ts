import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from '../entities/teacher.entity';
import { CreateTeacherDto } from '../dto/create-teacher.dto';
import { UpdateTeacherDto } from '../dto/update-teacher.dto';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {}

  async create(createTeacherDto: CreateTeacherDto): Promise<Teacher> {
    // Check for unique email
    const existingEmail = await this.teacherRepository.findOne({
      where: { email: createTeacherDto.email },
    });

    if (existingEmail) {
      throw new ConflictException(`Teacher with email ${createTeacherDto.email} already exists`);
    }

    // Check for unique employeeCode
    const existingCode = await this.teacherRepository.findOne({
      where: { employeeCode: createTeacherDto.employeeCode },
    });

    if (existingCode) {
      throw new ConflictException(
        `Teacher with code ${createTeacherDto.employeeCode} already exists`,
      );
    }

    const teacher = this.teacherRepository.create(createTeacherDto);
    return await this.teacherRepository.save(teacher);
  }

  async findAll(): Promise<Teacher[]> {
    return await this.teacherRepository.find({
      relations: ['teachingAssignments'],
    });
  }

  async findOne(id: string): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['teachingAssignments'],
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async findByInstitution(institutionId: string): Promise<Teacher[]> {
    return await this.teacherRepository.find({
      where: { institutionId },
      relations: ['teachingAssignments'],
    });
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto): Promise<Teacher> {
    const teacher = await this.findOne(id);

    // Check for unique email if being updated
    if (updateTeacherDto.email && updateTeacherDto.email !== teacher.email) {
      const existingEmail = await this.teacherRepository.findOne({
        where: { email: updateTeacherDto.email },
      });

      if (existingEmail) {
        throw new ConflictException(`Teacher with email ${updateTeacherDto.email} already exists`);
      }
    }

    // Check for unique employeeCode if being updated
    if (updateTeacherDto.employeeCode && updateTeacherDto.employeeCode !== teacher.employeeCode) {
      const existingCode = await this.teacherRepository.findOne({
        where: { employeeCode: updateTeacherDto.employeeCode },
      });

      if (existingCode) {
        throw new ConflictException(
          `Teacher with code ${updateTeacherDto.employeeCode} already exists`,
        );
      }
    }

    Object.assign(teacher, updateTeacherDto);
    return await this.teacherRepository.save(teacher);
  }

  async remove(id: string): Promise<void> {
    const teacher = await this.findOne(id);
    await this.teacherRepository.remove(teacher);
  }
}
