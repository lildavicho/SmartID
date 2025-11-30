import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../entities/group.entity';
import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const group = this.groupRepository.create(createGroupDto);
    return await this.groupRepository.save(group);
  }

  async findAll(): Promise<Group[]> {
    return await this.groupRepository.find({
      relations: ['course', 'enrollments', 'teachingAssignments'],
    });
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['course', 'enrollments', 'teachingAssignments'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  async findByCourse(courseId: string): Promise<Group[]> {
    return await this.groupRepository.find({
      where: { courseId },
      relations: ['course', 'enrollments', 'teachingAssignments'],
    });
  }

  async update(id: string, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);
    Object.assign(group, updateGroupDto);
    return await this.groupRepository.save(group);
  }

  async remove(id: string): Promise<void> {
    const group = await this.findOne(id);
    await this.groupRepository.remove(group);
  }
}
