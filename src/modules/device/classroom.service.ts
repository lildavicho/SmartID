import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClassroomDto, UpdateClassroomDto, QueryClassroomDto } from './dto';
import { Classroom } from './entities';

@Injectable()
export class ClassroomService {
  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
  ) {}

  /**
   * Create a new classroom
   */
  async create(createClassroomDto: CreateClassroomDto): Promise<Classroom> {
    const classroom = this.classroomRepository.create(createClassroomDto);
    return await this.classroomRepository.save(classroom);
  }

  /**
   * Find all classrooms with optional filters
   */
  async findAll(query: QueryClassroomDto): Promise<Classroom[]> {
    const { campusId } = query;

    const queryBuilder = this.classroomRepository
      .createQueryBuilder('classroom')
      .leftJoinAndSelect('classroom.devices', 'device');

    if (campusId) {
      queryBuilder.andWhere('classroom.campusId = :campusId', { campusId });
    }

    queryBuilder.orderBy('classroom.name', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Find one classroom by ID
   */
  async findOne(id: string): Promise<Classroom> {
    const classroom = await this.classroomRepository.findOne({
      where: { id },
      relations: ['devices'],
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found`);
    }

    return classroom;
  }

  /**
   * Update classroom
   */
  async update(id: string, updateClassroomDto: UpdateClassroomDto): Promise<Classroom> {
    await this.findOne(id);
    await this.classroomRepository.update(id, updateClassroomDto);
    return this.findOne(id);
  }

  /**
   * Remove classroom
   */
  async remove(id: string): Promise<void> {
    const classroom = await this.findOne(id);
    await this.classroomRepository.remove(classroom);
  }
}
