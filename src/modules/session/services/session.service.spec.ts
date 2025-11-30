import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SessionService } from './session.service';
import { AttendanceService } from './attendance.service';
import { ClassSession } from '../entities/class-session.entity';
import { SessionStatus } from '../enums/session-status.enum';
import { StartSessionDto } from '../dto/start-session.dto';
import { CloseSessionDto } from '../dto/close-session.dto';

describe('SessionService', () => {
  let service: SessionService;
  let sessionRepository: jest.Mocked<Repository<ClassSession>>;
  let attendanceService: jest.Mocked<AttendanceService>;

  const mockSession: ClassSession = {
    id: 'session-uuid',
    groupId: 'group-uuid',
    teacherId: 'teacher-uuid',
    classroomId: 'classroom-uuid',
    deviceId: 'device-uuid',
    scheduledStart: new Date('2024-01-15T08:00:00Z'),
    scheduledEnd: new Date('2024-01-15T10:00:00Z'),
    actualStart: null,
    actualEnd: null,
    status: SessionStatus.PENDING,
    snapshots: [],
    attendanceRecords: [],
    group: null,
    teacher: null,
    classroom: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getRepositoryToken(ClassSession),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: AttendanceService,
          useValue: {
            calculateAttendanceFromSnapshots: jest.fn(),
            applyManualCorrection: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    sessionRepository = module.get(getRepositoryToken(ClassSession));
    attendanceService = module.get(AttendanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startSession', () => {
    const startSessionDto: StartSessionDto = {
      groupId: 'group-uuid',
      classroomId: 'classroom-uuid',
      courseId: 'course-uuid',
      scheduledStart: '2024-01-15T08:00:00Z',
      scheduledEnd: '2024-01-15T10:00:00Z',
    };
    const teacherId = 'teacher-uuid';

    it('should create and start a session with IN_PROGRESS status', async () => {
      const createdSession = { ...mockSession, status: SessionStatus.IN_PROGRESS };
      sessionRepository.findOne.mockResolvedValue(null); // No active session
      sessionRepository.create.mockReturnValue(createdSession as ClassSession);
      sessionRepository.save.mockResolvedValue(createdSession as ClassSession);

      const result = await service.startSession(startSessionDto, teacherId);

      expect(sessionRepository.findOne).toHaveBeenCalled();
      expect(sessionRepository.create).toHaveBeenCalled();
      expect(sessionRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(SessionStatus.IN_PROGRESS);
      expect(result.actualStart).toBeInstanceOf(Date);
    });
  });

  describe('closeSession', () => {
    const closeSessionDto: CloseSessionDto = {
      sessionId: 'session-uuid',
      manualCorrections: [],
    };
    const teacherId = 'teacher-uuid';

    it('should close session and calculate attendance', async () => {
      const sessionToClose = { ...mockSession, status: SessionStatus.IN_PROGRESS };
      const closedSession = { ...sessionToClose, status: SessionStatus.CLOSED };

      sessionRepository.findOne.mockResolvedValue(sessionToClose as ClassSession);
      attendanceService.calculateAttendanceFromSnapshots.mockResolvedValue([]);
      sessionRepository.save.mockResolvedValue(closedSession as ClassSession);

      const result = await service.closeSession(closeSessionDto, teacherId);

      expect(attendanceService.calculateAttendanceFromSnapshots).toHaveBeenCalledWith(
        closeSessionDto.sessionId,
      );
      expect(result.status).toBe(SessionStatus.CLOSED);
      expect(result.actualEnd).toBeInstanceOf(Date);
    });

    it('should apply manual corrections when closing', async () => {
      const sessionToClose = { ...mockSession, status: SessionStatus.IN_PROGRESS };
      const closedSession = { ...sessionToClose, status: SessionStatus.CLOSED };
      const corrections = [
        {
          studentId: 'student-1',
          status: 'PRESENT' as any,
          arrivalTime: '2024-01-15T08:05:00Z',
        },
      ];

      sessionRepository.findOne.mockResolvedValue(sessionToClose as ClassSession);
      attendanceService.calculateAttendanceFromSnapshots.mockResolvedValue([]);
      attendanceService.applyManualCorrection.mockResolvedValue({} as any);
      sessionRepository.save.mockResolvedValue(closedSession as ClassSession);

      await service.closeSession(
        { ...closeSessionDto, manualCorrections: corrections },
        teacherId,
      );

      expect(attendanceService.applyManualCorrection).toHaveBeenCalled();
    });

    it('should throw NotFoundException if session does not exist', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(service.closeSession(closeSessionDto, teacherId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if teacher does not own session', async () => {
      sessionRepository.findOne.mockResolvedValue(mockSession as ClassSession);

      await expect(service.closeSession(closeSessionDto, 'different-teacher')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if session is already closed', async () => {
      const closedSession = { ...mockSession, status: SessionStatus.CLOSED };
      sessionRepository.findOne.mockResolvedValue(closedSession as ClassSession);

      await expect(service.closeSession(closeSessionDto, teacherId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
