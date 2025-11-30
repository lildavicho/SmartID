import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { Institution, Campus } from './entities';
import { CreateInstitutionDto, UpdateInstitutionDto, QueryInstitutionDto } from './dto';

describe('InstitutionService', () => {
  let service: InstitutionService;
  let institutionRepository: jest.Mocked<Repository<Institution>>;
  let campusRepository: jest.Mocked<Repository<Campus>>;

  const mockInstitution: Institution = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Universidad Nacional',
    code: 'INST001',
    country: 'Colombia',
    timezone: 'America/Bogota',
    config: { academicYear: 2024 },
    isActive: true,
    campuses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCampus: Campus = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    institutionId: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Campus Central',
    address: 'Av. Principal 123',
    city: 'Bogotá',
    isActive: true,
    institution: mockInstitution,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionService,
        {
          provide: getRepositoryToken(Institution),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Campus),
          useValue: {
            find: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InstitutionService>(InstitutionService);
    institutionRepository = module.get(getRepositoryToken(Institution));
    campusRepository = module.get(getRepositoryToken(Campus));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateInstitutionDto = {
      name: 'Universidad Nacional',
      code: 'INST001',
      country: 'Colombia',
      timezone: 'America/Bogota',
    };

    it('should create an institution successfully', async () => {
      institutionRepository.findOne.mockResolvedValue(null);
      institutionRepository.create.mockReturnValue(mockInstitution);
      institutionRepository.save.mockResolvedValue(mockInstitution);

      const result = await service.create(createDto);

      expect(institutionRepository.findOne).toHaveBeenCalledWith({
        where: { code: createDto.code },
      });
      expect(institutionRepository.create).toHaveBeenCalledWith(createDto);
      expect(institutionRepository.save).toHaveBeenCalledWith(mockInstitution);
      expect(result).toEqual(mockInstitution);
    });

    it('should throw ConflictException if code already exists', async () => {
      institutionRepository.findOne.mockResolvedValue(mockInstitution);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(institutionRepository.findOne).toHaveBeenCalledWith({
        where: { code: createDto.code },
      });
      expect(institutionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const query: QueryInstitutionDto = {
      page: 1,
      limit: 10,
    };

    it('should return paginated institutions', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockInstitution]),
      };

      institutionRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: [mockInstitution],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply search filter', async () => {
      const queryWithSearch: QueryInstitutionDto = {
        ...query,
        search: 'Universidad',
      };

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockInstitution]),
      };

      institutionRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      await service.findAll(queryWithSearch);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(institution.name ILIKE :search OR institution.code ILIKE :search)',
        { search: '%Universidad%' },
      );
    });
  });

  describe('findOne', () => {
    it('should return an institution by id', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockInstitution),
      };

      institutionRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.findOne(mockInstitution.id);

      expect(result).toEqual(mockInstitution);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('institution.id = :id', {
        id: mockInstitution.id,
      });
    });

    it('should throw NotFoundException if institution not found', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      institutionRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should include campuses when requested', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockInstitution),
      };

      institutionRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      await service.findOne(mockInstitution.id, true);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'institution.campuses',
        'campus',
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateInstitutionDto = {
      name: 'Universidad Nacional Actualizada',
    };

    it('should update an institution successfully', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockInstitution),
      };

      institutionRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      institutionRepository.update.mockResolvedValue(undefined);

      const result = await service.update(mockInstitution.id, updateDto);

      expect(institutionRepository.update).toHaveBeenCalledWith(mockInstitution.id, updateDto);
      expect(result).toEqual(mockInstitution);
    });

    it('should throw NotFoundException if institution not found', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      institutionRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an institution successfully', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockInstitution),
      };

      institutionRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      campusRepository.count.mockResolvedValue(0);
      institutionRepository.remove.mockResolvedValue(mockInstitution);

      await service.remove(mockInstitution.id);

      expect(campusRepository.count).toHaveBeenCalledWith({
        where: { institutionId: mockInstitution.id },
      });
      expect(institutionRepository.remove).toHaveBeenCalledWith(mockInstitution);
    });

    it('should throw BadRequestException if institution has campuses', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockInstitution),
      };

      institutionRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      campusRepository.count.mockResolvedValue(2);

      await expect(service.remove(mockInstitution.id)).rejects.toThrow(BadRequestException);
      expect(institutionRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('getCampuses', () => {
    it('should return all campuses for an institution', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockInstitution),
      };

      institutionRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      campusRepository.find.mockResolvedValue([mockCampus]);

      const result = await service.getCampuses(mockInstitution.id);

      expect(result).toEqual([mockCampus]);
      expect(campusRepository.find).toHaveBeenCalledWith({
        where: { institutionId: mockInstitution.id },
        order: { createdAt: 'DESC' },
      });
    });

    it('should throw NotFoundException if institution not found', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      institutionRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      await expect(service.getCampuses('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
