import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SessionService } from './session.service';
import { AttendanceService } from './attendance.service';
import { SnapshotService } from './snapshot.service';
import { ClassSession } from '../entities/class-session.entity';
import { SessionStatus } from '../enums/session-status.enum';
import { StartSessionDto } from '../dto/start-session.dto';
import { CloseSessionDto } from '../dto/close-session.dto';

describe('SessionService', () => {
  let service: SessionService;
  let sessionRepository: jest.Mocked<Repository<ClassSession>>;
  let attendanceService: jest.Mocked<AttendanceService>;
  let snapshotService: jest.Mocked<SnapshotService>;

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
    createdBy: 'teacher-uuid',
    updatedBy: 'teacher-uuid',
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
        {
          provide: SnapshotService,
          useValue: {
            createSnapshot: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    sessionRepository = module.get(getRepositoryToken(ClassSession));
    attendanceService = module.get(AttendanceService);
    snapshotService = module.get(SnapshotService);
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
      const createdSession = {
        ...mockSession,
        status: SessionStatus.IN_PROGRESS,
        actualStart: new Date(),
      };
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
      const sessionToClose = {
        ...mockSession,
        status: SessionStatus.IN_PROGRESS,
        group: { id: 'group-uuid' } as any,
        teacher: { id: teacherId } as any,
      };
      // closeSession llama a finishSession que establece status a FINISHED
      const closedSession = {
        ...sessionToClose,
        status: SessionStatus.FINISHED,
        actualEnd: new Date(),
      };

      sessionRepository.findOne.mockResolvedValue(sessionToClose as ClassSession);
      attendanceService.calculateAttendanceFromSnapshots.mockResolvedValue([]);
      attendanceService.applyManualCorrection.mockResolvedValue({} as any);
      sessionRepository.save.mockResolvedValue(closedSession as ClassSession);

      const result = await service.closeSession(closeSessionDto, teacherId);

      expect(attendanceService.calculateAttendanceFromSnapshots).toHaveBeenCalledWith(
        closeSessionDto.sessionId,
      );
      expect(result.status).toBe(SessionStatus.FINISHED);
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

  describe('openSessionForTeacher', () => {
    const startSessionDto: StartSessionDto = {
      groupId: 'group-uuid',
      classroomId: 'classroom-uuid',
      courseId: 'course-uuid',
      scheduledStart: '2024-01-15T08:00:00Z',
      scheduledEnd: '2024-01-15T10:00:00Z',
    };
    const teacherId = 'teacher-uuid';

    it('should create a new session when teacher has no active session', async () => {
      const createdSession = {
        ...mockSession,
        status: SessionStatus.IN_PROGRESS,
        actualStart: new Date(),
        createdBy: teacherId,
        updatedBy: teacherId,
      };
      sessionRepository.findOne.mockResolvedValue(null); // No active session
      sessionRepository.create.mockReturnValue(createdSession as ClassSession);
      sessionRepository.save.mockResolvedValue(createdSession as ClassSession);

      const result = await service.openSessionForTeacher(startSessionDto, teacherId);

      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { teacherId, status: SessionStatus.IN_PROGRESS },
      });
      expect(sessionRepository.create).toHaveBeenCalled();
      expect(sessionRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(SessionStatus.IN_PROGRESS);
      expect(result.createdBy).toBe(teacherId);
      expect(result.updatedBy).toBe(teacherId);
    });

    it('should throw BadRequestException if teacher already has an active session', async () => {
      const activeSession = { ...mockSession, status: SessionStatus.IN_PROGRESS };
      sessionRepository.findOne.mockResolvedValue(activeSession as ClassSession);

      await expect(
        service.openSessionForTeacher(startSessionDto, teacherId),
      ).rejects.toThrow(BadRequestException);

      expect(sessionRepository.create).not.toHaveBeenCalled();
      expect(sessionRepository.save).not.toHaveBeenCalled();
    });

    it('should accept optional deviceId parameter', async () => {
      const deviceId = 'device-uuid';
      const createdSession = {
        ...mockSession,
        status: SessionStatus.IN_PROGRESS,
        deviceId,
        actualStart: new Date(),
        createdBy: teacherId,
        updatedBy: teacherId,
      };
      sessionRepository.findOne.mockResolvedValue(null);
      sessionRepository.create.mockReturnValue(createdSession as ClassSession);
      sessionRepository.save.mockResolvedValue(createdSession as ClassSession);

      const result = await service.openSessionForTeacher(startSessionDto, teacherId, deviceId);

      expect(result.deviceId).toBe(deviceId);
    });
  });

  describe('finishSession', () => {
    const sessionId = 'session-uuid';
    const teacherId = 'teacher-uuid';

    it('should finish a session successfully', async () => {
      const sessionToFinish = {
        ...mockSession,
        id: sessionId,
        status: SessionStatus.IN_PROGRESS,
        group: { id: 'group-uuid' } as any,
        teacher: { id: teacherId } as any,
      };
      const finishedSession = {
        ...sessionToFinish,
        status: SessionStatus.FINISHED,
        actualEnd: new Date(),
        updatedBy: teacherId,
      };

      sessionRepository.findOne.mockResolvedValue(sessionToFinish as ClassSession);
      attendanceService.calculateAttendanceFromSnapshots.mockResolvedValue([]);
      sessionRepository.save.mockResolvedValue(finishedSession as ClassSession);

      const result = await service.finishSession(sessionId, teacherId);

      expect(attendanceService.calculateAttendanceFromSnapshots).toHaveBeenCalledWith(sessionId);
      expect(result.status).toBe(SessionStatus.FINISHED);
      expect(result.actualEnd).toBeInstanceOf(Date);
      expect(result.updatedBy).toBe(teacherId);
    });

    it('should throw NotFoundException if session does not exist', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(service.finishSession(sessionId, teacherId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if teacher does not own session', async () => {
      const sessionToFinish = {
        ...mockSession,
        id: sessionId,
        status: SessionStatus.IN_PROGRESS,
        teacherId: 'different-teacher',
      };
      sessionRepository.findOne.mockResolvedValue(sessionToFinish as ClassSession);

      await expect(service.finishSession(sessionId, teacherId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if session is already finished', async () => {
      const finishedSession = {
        ...mockSession,
        id: sessionId,
        status: SessionStatus.FINISHED,
        teacherId,
      };
      sessionRepository.findOne.mockResolvedValue(finishedSession as ClassSession);

      await expect(service.finishSession(sessionId, teacherId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept optional finishedBy parameter', async () => {
      const finishedBy = 'admin-uuid';
      const sessionToFinish = {
        ...mockSession,
        id: sessionId,
        status: SessionStatus.IN_PROGRESS,
        teacherId,
        group: { id: 'group-uuid' } as any,
        teacher: { id: teacherId } as any,
      };
      const finishedSession = {
        ...sessionToFinish,
        status: SessionStatus.FINISHED,
        actualEnd: new Date(),
        updatedBy: finishedBy,
      };

      sessionRepository.findOne.mockResolvedValue(sessionToFinish as ClassSession);
      attendanceService.calculateAttendanceFromSnapshots.mockResolvedValue([]);
      sessionRepository.save.mockResolvedValue(finishedSession as ClassSession);

      const result = await service.finishSession(sessionId, teacherId, finishedBy);

      expect(result.updatedBy).toBe(finishedBy);
    });
  });

  describe('getActiveSessionForTeacher', () => {
    const teacherId = 'teacher-uuid';

    it('should return active session when one exists', async () => {
      const activeSession = {
        ...mockSession,
        teacherId,
        status: SessionStatus.IN_PROGRESS,
        group: { id: 'group-uuid', course: { id: 'course-uuid' } } as any,
        classroom: { id: 'classroom-uuid' } as any,
      };
      sessionRepository.findOne.mockResolvedValue(activeSession as ClassSession);

      const result = await service.getActiveSessionForTeacher(teacherId);

      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { teacherId, status: SessionStatus.IN_PROGRESS },
        relations: ['group', 'group.course', 'classroom'],
        order: { actualStart: 'DESC' },
      });
      expect(result).toEqual(activeSession);
    });

    it('should return null when no active session exists', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      const result = await service.getActiveSessionForTeacher(teacherId);

      expect(result).toBeNull();
    });

    it('should return null on error instead of throwing', async () => {
      sessionRepository.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.getActiveSessionForTeacher(teacherId);

      expect(result).toBeNull();
    });
  });
});
