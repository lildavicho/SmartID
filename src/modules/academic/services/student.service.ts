import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    // Check for unique email
    const existingEmail = await this.studentRepository.findOne({
      where: { email: createStudentDto.email },
    });

    if (existingEmail) {
      throw new ConflictException(`Student with email ${createStudentDto.email} already exists`);
    }

    // Check for unique studentCode
    const existingCode = await this.studentRepository.findOne({
      where: { studentCode: createStudentDto.studentCode },
    });

    if (existingCode) {
      throw new ConflictException(
        `Student with code ${createStudentDto.studentCode} already exists`,
      );
    }

    const student = this.studentRepository.create({
      ...createStudentDto,
      enrollmentDate: new Date(createStudentDto.enrollmentDate),
    });
    return await this.studentRepository.save(student);
  }

  async findAll(): Promise<Student[]> {
    return await this.studentRepository.find({
      relations: ['enrollments'],
    });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['enrollments'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async findByInstitution(institutionId: string): Promise<Student[]> {
    return await this.studentRepository.find({
      where: { institutionId },
      relations: ['enrollments'],
    });
  }

  async findByEmail(email: string): Promise<Student | null> {
    return await this.studentRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);

    // Check for unique email if being updated
    if (updateStudentDto.email && updateStudentDto.email !== student.email) {
      const existingEmail = await this.studentRepository.findOne({
        where: { email: updateStudentDto.email },
      });

      if (existingEmail) {
        throw new ConflictException(`Student with email ${updateStudentDto.email} already exists`);
      }
    }

    // Check for unique studentCode if being updated
    if (updateStudentDto.studentCode && updateStudentDto.studentCode !== student.studentCode) {
      const existingCode = await this.studentRepository.findOne({
        where: { studentCode: updateStudentDto.studentCode },
      });

      if (existingCode) {
        throw new ConflictException(
          `Student with code ${updateStudentDto.studentCode} already exists`,
        );
      }
    }

    Object.assign(student, updateStudentDto);

    if (updateStudentDto.enrollmentDate) {
      student.enrollmentDate = new Date(updateStudentDto.enrollmentDate);
    }

    return await this.studentRepository.save(student);
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentRepository.remove(student);
  }
}
