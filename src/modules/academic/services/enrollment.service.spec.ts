import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EnrollmentService } from './enrollment.service';
import { Enrollment } from '../entities/enrollment.entity';
import { Student } from '../entities/student.entity';
import { Group } from '../entities/group.entity';
import { EnrollmentStatus } from '../enums/enrollment-status.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('EnrollmentService', () => {
  let service: EnrollmentService;

  const mockEnrollmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockStudentRepository = {
    findOne: jest.fn(),
  };

  const mockGroupRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentService,
        {
          provide: getRepositoryToken(Enrollment),
          useValue: mockEnrollmentRepository,
        },
        {
          provide: getRepositoryToken(Student),
          useValue: mockStudentRepository,
        },
        {
          provide: getRepositoryToken(Group),
          useValue: mockGroupRepository,
        },
      ],
    }).compile();

    service = module.get<EnrollmentService>(EnrollmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enrollStudent', () => {
    const enrollDto = {
      studentId: 'student-uuid',
      groupId: 'group-uuid',
    };

    const mockStudent = {
      id: 'student-uuid',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockGroup = {
      id: 'group-uuid',
      name: 'Group A',
    };

    it('should successfully enroll a student', async () => {
      const mockEnrollment = {
        id: 'enrollment-uuid',
        studentId: enrollDto.studentId,
        groupId: enrollDto.groupId,
        enrollmentDate: new Date(),
        status: EnrollmentStatus.ACTIVE,
      };

      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);
      mockEnrollmentRepository.findOne.mockResolvedValue(null);
      mockEnrollmentRepository.create.mockReturnValue(mockEnrollment);
      mockEnrollmentRepository.save.mockResolvedValue(mockEnrollment);

      const result = await service.enrollStudent(enrollDto);

      expect(result).toEqual(mockEnrollment);
      expect(mockStudentRepository.findOne).toHaveBeenCalledWith({
        where: { id: enrollDto.studentId },
      });
      expect(mockGroupRepository.findOne).toHaveBeenCalledWith({
        where: { id: enrollDto.groupId },
      });
      expect(mockEnrollmentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if student does not exist', async () => {
      mockStudentRepository.findOne.mockResolvedValue(null);

      await expect(service.enrollStudent(enrollDto)).rejects.toThrow(NotFoundException);
      await expect(service.enrollStudent(enrollDto)).rejects.toThrow(
        `Student with ID ${enrollDto.studentId} not found`,
      );
    });

    it('should throw NotFoundException if group does not exist', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockGroupRepository.findOne.mockResolvedValue(null);

      await expect(service.enrollStudent(enrollDto)).rejects.toThrow(NotFoundException);
      await expect(service.enrollStudent(enrollDto)).rejects.toThrow(
        `Group with ID ${enrollDto.groupId} not found`,
      );
    });

    it('should throw BadRequestException if student is already enrolled', async () => {
      const existingEnrollment = {
        id: 'existing-enrollment-uuid',
        studentId: enrollDto.studentId,
        groupId: enrollDto.groupId,
        status: EnrollmentStatus.ACTIVE,
      };

      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);
      mockEnrollmentRepository.findOne.mockResolvedValue(existingEnrollment);

      await expect(service.enrollStudent(enrollDto)).rejects.toThrow(BadRequestException);
      await expect(service.enrollStudent(enrollDto)).rejects.toThrow(
        'Student is already enrolled in this group',
      );
    });
  });

  describe('unenrollStudent', () => {
    it('should successfully unenroll a student', async () => {
      const enrollmentId = 'enrollment-uuid';
      const mockEnrollment = {
        id: enrollmentId,
        studentId: 'student-uuid',
        groupId: 'group-uuid',
        status: EnrollmentStatus.ACTIVE,
      };

      mockEnrollmentRepository.findOne.mockResolvedValue(mockEnrollment);
      mockEnrollmentRepository.save.mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.INACTIVE,
      });

      const result = await service.unenrollStudent(enrollmentId);

      expect(result.status).toBe(EnrollmentStatus.INACTIVE);
      expect(mockEnrollmentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if enrollment does not exist', async () => {
      const enrollmentId = 'non-existent-uuid';
      mockEnrollmentRepository.findOne.mockResolvedValue(null);

      await expect(service.unenrollStudent(enrollmentId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStudentsByGroup', () => {
    it('should return students enrolled in a group', async () => {
      const groupId = 'group-uuid';
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          groupId,
          student: { id: 'student-1', firstName: 'John', lastName: 'Doe' },
          status: EnrollmentStatus.ACTIVE,
        },
        {
          id: 'enrollment-2',
          groupId,
          student: { id: 'student-2', firstName: 'Jane', lastName: 'Smith' },
          status: EnrollmentStatus.ACTIVE,
        },
      ];

      mockEnrollmentRepository.find.mockResolvedValue(mockEnrollments);

      const result = await service.getStudentsByGroup(groupId);

      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('John');
      expect(result[1].firstName).toBe('Jane');
      expect(mockEnrollmentRepository.find).toHaveBeenCalledWith({
        where: {
          groupId,
          status: EnrollmentStatus.ACTIVE,
        },
        relations: ['student'],
      });
    });
  });
});
