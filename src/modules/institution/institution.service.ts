import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInstitutionDto, UpdateInstitutionDto, QueryInstitutionDto } from './dto';
import { Institution, Campus } from './entities';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class InstitutionService {
  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
    @InjectRepository(Campus)
    private readonly campusRepository: Repository<Campus>,
  ) {}

  /**
   * Create a new institution
   * Validates that the code is unique
   */
  async create(createInstitutionDto: CreateInstitutionDto): Promise<Institution> {
    // Validate unique code
    await this.validateUniqueCode(createInstitutionDto.code);

    const institution = this.institutionRepository.create(createInstitutionDto);
    return await this.institutionRepository.save(institution);
  }

  /**
   * Find all institutions with pagination and filters
   */
  async findAll(query: QueryInstitutionDto): Promise<PaginatedResult<Institution>> {
    const { page = 1, limit = 10, search, country, isActive } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.institutionRepository.createQueryBuilder('institution');

    // Apply filters
    if (search) {
      queryBuilder.andWhere('(institution.name ILIKE :search OR institution.code ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (country) {
      queryBuilder.andWhere('institution.country = :country', { country });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('institution.isActive = :isActive', { isActive });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Order by creation date
    queryBuilder.orderBy('institution.createdAt', 'DESC');

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find one institution by ID
   * Optionally include campuses
   */
  async findOne(id: string, includeCampuses = false): Promise<Institution> {
    const queryBuilder = this.institutionRepository
      .createQueryBuilder('institution')
      .where('institution.id = :id', { id });

    if (includeCampuses) {
      queryBuilder.leftJoinAndSelect('institution.campuses', 'campus');
    }

    const institution = await queryBuilder.getOne();

    if (!institution) {
      throw new NotFoundException(`Institution with ID ${id} not found`);
    }

    return institution;
  }

  /**
   * Update an institution
   * Validates unique code if it's being changed
   */
  async update(id: string, updateInstitutionDto: UpdateInstitutionDto): Promise<Institution> {
    const institution = await this.findOne(id);

    // Validate unique code if it's being changed
    if (updateInstitutionDto.code && updateInstitutionDto.code !== institution.code) {
      await this.validateUniqueCode(updateInstitutionDto.code);
    }

    await this.institutionRepository.update(id, updateInstitutionDto);
    return this.findOne(id);
  }

  /**
   * Remove an institution
   * Validates that it doesn't have associated campuses
   */
  async remove(id: string): Promise<void> {
    const institution = await this.findOne(id);

    // Check if institution has campuses
    const campusCount = await this.campusRepository.count({
      where: { institutionId: id },
    });

    if (campusCount > 0) {
      throw new BadRequestException(
        `Cannot delete institution with ${campusCount} associated campus(es). Please delete the campuses first.`,
      );
    }

    await this.institutionRepository.remove(institution);
  }

  /**
   * Get all campuses for an institution
   */
  async getCampuses(institutionId: string): Promise<Campus[]> {
    // Verify institution exists
    await this.findOne(institutionId);

    return await this.campusRepository.find({
      where: { institutionId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Validate that institution code is unique
   */
  private async validateUniqueCode(code: string): Promise<void> {
    const existing = await this.institutionRepository.findOne({
      where: { code },
    });

    if (existing) {
      throw new ConflictException(`Institution with code '${code}' already exists`);
    }
  }
}
