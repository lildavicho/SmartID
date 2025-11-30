import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeachingAssignment } from '../entities/teaching-assignment.entity';
import { Teacher } from '../entities/teacher.entity';
import { Group } from '../entities/group.entity';
import { AssignTeacherDto } from '../dto/assign-teacher.dto';

@Injectable()
export class TeachingAssignmentService {
  constructor(
    @InjectRepository(TeachingAssignment)
    private readonly assignmentRepository: Repository<TeachingAssignment>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async assignTeacher(assignTeacherDto: AssignTeacherDto): Promise<TeachingAssignment> {
    const { teacherId, groupId, academicTerm } = assignTeacherDto;

    // Verify teacher exists
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    // Verify group exists
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    // Check if teacher is already assigned to this group for this term
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        teacherId,
        groupId,
        academicTerm,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        `Teacher is already assigned to this group for academic term ${academicTerm}`,
      );
    }

    const assignment = this.assignmentRepository.create({
      teacherId,
      groupId,
      academicTerm,
    });

    return await this.assignmentRepository.save(assignment);
  }

  async getTeacherAssignments(teacherId: string): Promise<TeachingAssignment[]> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    return await this.assignmentRepository.find({
      where: { teacherId },
      relations: ['group', 'group.course'],
    });
  }

  async getGroupTeacher(groupId: string, academicTerm?: string): Promise<Teacher | null> {
    const whereCondition: { groupId: string; academicTerm?: string } = { groupId };

    if (academicTerm) {
      whereCondition.academicTerm = academicTerm;
    }

    const assignment = await this.assignmentRepository.findOne({
      where: whereCondition,
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
    });

    return assignment ? assignment.teacher : null;
  }

  async findAll(): Promise<TeachingAssignment[]> {
    return await this.assignmentRepository.find({
      relations: ['teacher', 'group'],
    });
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException(`Teaching assignment with ID ${id} not found`);
    }

    await this.assignmentRepository.remove(assignment);
  }
}
