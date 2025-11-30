import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../entities/enrollment.entity';
import { Student } from '../entities/student.entity';
import { Group } from '../entities/group.entity';
import { EnrollStudentDto } from '../dto/enroll-student.dto';
import { EnrollmentStatus } from '../enums/enrollment-status.enum';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async enrollStudent(enrollStudentDto: EnrollStudentDto): Promise<Enrollment> {
    const { studentId, groupId, enrollmentDate } = enrollStudentDto;

    // Verify student exists
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // Verify group exists
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    // Check if student is already enrolled in this group
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: {
        studentId,
        groupId,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    if (existingEnrollment) {
      throw new BadRequestException(`Student is already enrolled in this group`);
    }

    const enrollment = this.enrollmentRepository.create({
      studentId,
      groupId,
      enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
      status: EnrollmentStatus.ACTIVE,
    });

    return await this.enrollmentRepository.save(enrollment);
  }

  async unenrollStudent(enrollmentId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found`);
    }

    enrollment.status = EnrollmentStatus.INACTIVE;
    return await this.enrollmentRepository.save(enrollment);
  }

  async getStudentsByGroup(groupId: string): Promise<Student[]> {
    const enrollments = await this.enrollmentRepository.find({
      where: {
        groupId,
        status: EnrollmentStatus.ACTIVE,
      },
      relations: ['student'],
    });

    return enrollments.map((enrollment) => enrollment.student);
  }

  async findAll(): Promise<Enrollment[]> {
    return await this.enrollmentRepository.find({
      relations: ['student', 'group'],
    });
  }

  async findOne(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
      relations: ['student', 'group'],
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    return enrollment;
  }
}
