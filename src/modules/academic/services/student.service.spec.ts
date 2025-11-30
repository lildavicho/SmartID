import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StudentService } from './student.service';
import { Student } from '../entities/student.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('StudentService', () => {
  let service: StudentService;

  const mockStudentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        {
          provide: getRepositoryToken(Student),
          useValue: mockStudentRepository,
        },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createStudentDto = {
      institutionId: 'institution-uuid',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      studentCode: 'STU001',
      enrollmentDate: '2024-01-01',
    };

    it('should successfully create a student', async () => {
      const mockStudent = {
        id: 'student-uuid',
        ...createStudentDto,
        enrollmentDate: new Date(createStudentDto.enrollmentDate),
      };

      mockStudentRepository.findOne
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // studentCode check
      mockStudentRepository.create.mockReturnValue(mockStudent);
      mockStudentRepository.save.mockResolvedValue(mockStudent);

      const result = await service.create(createStudentDto);

      expect(result).toEqual(mockStudent);
      expect(mockStudentRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockStudentRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingStudent = {
        id: 'existing-uuid',
        email: createStudentDto.email,
      };

      mockStudentRepository.findOne.mockResolvedValue(existingStudent);

      await expect(service.create(createStudentDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createStudentDto)).rejects.toThrow(
        `Student with email ${createStudentDto.email} already exists`,
      );
    });

    it('should throw ConflictException if studentCode already exists', async () => {
      const existingStudent = {
        id: 'existing-uuid',
        studentCode: createStudentDto.studentCode,
      };

      mockStudentRepository.findOne
        .mockResolvedValueOnce(null) // email check passes
        .mockResolvedValueOnce(existingStudent); // studentCode check fails

      await expect(service.create(createStudentDto)).rejects.toThrow(
        `Student with code ${createStudentDto.studentCode} already exists`,
      );
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      const mockStudent = {
        id: 'student-uuid',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      };

      mockStudentRepository.findOne.mockResolvedValue(mockStudent);

      const result = await service.findOne('student-uuid');

      expect(result).toEqual(mockStudent);
      expect(mockStudentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'student-uuid' },
        relations: ['enrollments'],
      });
    });

    it('should throw NotFoundException if student does not exist', async () => {
      mockStudentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateStudentDto = {
      email: 'newemail@example.com',
    };

    it('should successfully update a student', async () => {
      const existingStudent = {
        id: 'student-uuid',
        firstName: 'John',
        lastName: 'Doe',
        email: 'old@example.com',
        studentCode: 'STU001',
      };

      const updatedStudent = {
        ...existingStudent,
        email: updateStudentDto.email,
      };

      mockStudentRepository.findOne
        .mockResolvedValueOnce(existingStudent) // findOne in update
        .mockResolvedValueOnce(null); // email uniqueness check
      mockStudentRepository.save.mockResolvedValue(updatedStudent);

      const result = await service.update('student-uuid', updateStudentDto);

      expect(result.email).toBe(updateStudentDto.email);
      expect(mockStudentRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if new email already exists', async () => {
      const existingStudent = {
        id: 'student-uuid',
        email: 'old@example.com',
        studentCode: 'STU001',
      };

      const anotherStudent = {
        id: 'another-uuid',
        email: updateStudentDto.email,
      };

      mockStudentRepository.findOne
        .mockResolvedValueOnce(existingStudent) // findOne in update
        .mockResolvedValueOnce(anotherStudent); // email uniqueness check fails

      await expect(service.update('student-uuid', updateStudentDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByInstitution', () => {
    it('should return students by institution', async () => {
      const mockStudents = [
        { id: 'student-1', institutionId: 'institution-uuid' },
        { id: 'student-2', institutionId: 'institution-uuid' },
      ];

      mockStudentRepository.find.mockResolvedValue(mockStudents);

      const result = await service.findByInstitution('institution-uuid');

      expect(result).toHaveLength(2);
      expect(mockStudentRepository.find).toHaveBeenCalledWith({
        where: { institutionId: 'institution-uuid' },
        relations: ['enrollments'],
      });
    });
  });
});
