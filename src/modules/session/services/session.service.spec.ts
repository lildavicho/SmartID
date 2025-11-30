import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionService } from './session.service';
import { AttendanceService } from './attendance.service';
import { ClassSession } from '../entities/class-session.entity';
import { SessionStatus } from '../enums/session-status.enum';
import { AttendanceStatus } from '../enums/attendance-status.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SessionService', () => {
  let service: SessionService;

  const mockSessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAttendanceService = {
    calculateAttendanceFromSnapshots: jest.fn(),
    applyManualCorrection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getRepositoryToken(ClassSession),
          useValue: mockSessionRepository,
        },
        {
          provide: AttendanceService,
          useValue: mockAttendanceService,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startSession', () => {
    it('should create and start a session with ACTIVE status', async () => {
      const startSessionDto = {
        groupId: 'group-uuid',
        teacherId: 'teacher-uuid',
        classroomId: 'classroom-uuid',
        deviceId: 'device-uuid',
        scheduledStart: '2024-01-15T08:00:00Z',
        scheduledEnd: '2024-01-15T10:00:00Z',
      };

      const mockSession = {
        id: 'session-uuid',
        ...startSessionDto,
        scheduledStart: new Date(startSessionDto.scheduledStart),
        scheduledEnd: new Date(startSessionDto.scheduledEnd),
        actualStart: expect.any(Date),
        status: SessionStatus.ACTIVE,
      };

      mockSessionRepository.create.mockReturnValue(mockSession);
      mockSessionRepository.save.mockResolvedValue(mockSession);

      const result = await service.startSession(startSessionDto);

      expect(result.status).toBe(SessionStatus.ACTIVE);
      expect(result.actualStart).toBeDefined();
      expect(mockSessionRepository.save).toHaveBeenCalled();
    });
  });

  describe('closeSession', () => {
    const sessionId = 'session-uuid';

    it('should close session and calculate attendance', async () => {
      const mockSession = {
        id: sessionId,
        groupId: 'group-uuid',
        teacherId: 'teacher-uuid',
        classroomId: 'classroom-uuid',
        status: SessionStatus.ACTIVE,
        actualStart: new Date(),
      };

      const closeSessionDto = {
        sessionId,
        manualCorrections: [],
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockAttendanceService.calculateAttendanceFromSnapshots.mockResolvedValue([]);
      mockSessionRepository.save.mockResolvedValue({
        ...mockSession,
        status: SessionStatus.CLOSED,
        actualEnd: expect.any(Date),
      });

      const result = await service.closeSession(closeSessionDto);

      expect(result.status).toBe(SessionStatus.CLOSED);
      expect(result.actualEnd).toBeDefined();
      expect(mockAttendanceService.calculateAttendanceFromSnapshots).toHaveBeenCalledWith(
        sessionId,
      );
    });

    it('should apply manual corrections when closing', async () => {
      const mockSession = {
        id: sessionId,
        status: SessionStatus.ACTIVE,
      };

      const closeSessionDto = {
        sessionId,
        manualCorrections: [
          {
            studentId: 'student-1',
            status: AttendanceStatus.EXCUSED,
            arrivalTime: '2024-01-15T08:00:00Z',
          },
        ],
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockAttendanceService.calculateAttendanceFromSnapshots.mockResolvedValue([]);
      mockAttendanceService.applyManualCorrection.mockResolvedValue({});
      mockSessionRepository.save.mockResolvedValue({
        ...mockSession,
        status: SessionStatus.CLOSED,
      });

      await service.closeSession(closeSessionDto);

      expect(mockAttendanceService.applyManualCorrection).toHaveBeenCalledWith(
        sessionId,
        'student-1',
        AttendanceStatus.EXCUSED,
        expect.any(Date),
      );
    });

    it('should throw NotFoundException if session does not exist', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.closeSession({ sessionId: 'non-existent', manualCorrections: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if session is already closed', async () => {
      const mockSession = {
        id: sessionId,
        status: SessionStatus.CLOSED,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);

      await expect(service.closeSession({ sessionId, manualCorrections: [] })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getSessionDetails', () => {
    it('should return session with snapshots and attendance records', async () => {
      const sessionId = 'session-uuid';
      const mockSession = {
        id: sessionId,
        groupId: 'group-uuid',
        snapshots: [],
        attendanceRecords: [],
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.getSessionDetails(sessionId);

      expect(result).toEqual(mockSession);
      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: sessionId },
        relations: ['snapshots', 'attendanceRecords'],
      });
    });
  });

  describe('findAll with filters', () => {
    it('should filter sessions by groupId', async () => {
      const filters = { groupId: 'group-uuid' };
      const mockSessions = [
        { id: 'session-1', groupId: 'group-uuid' },
        { id: 'session-2', groupId: 'group-uuid' },
      ];

      mockSessionRepository.find.mockResolvedValue(mockSessions);

      const result = await service.findAll(filters);

      expect(result).toHaveLength(2);
      expect(mockSessionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ groupId: 'group-uuid' }),
        }),
      );
    });

    it('should filter sessions by date range', async () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      mockSessionRepository.find.mockResolvedValue([]);

      await service.findAll(filters);

      expect(mockSessionRepository.find).toHaveBeenCalled();
    });
  });
});
