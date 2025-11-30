import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { AttendanceSnapshot } from '../entities/attendance-snapshot.entity';
import { ClassSession } from '../entities/class-session.entity';
import { AttendanceStatus } from '../enums/attendance-status.enum';
import { AttendanceOrigin } from '../enums/attendance-origin.enum';
import { SessionStatus } from '../enums/session-status.enum';
import { NotFoundException } from '@nestjs/common';

describe('AttendanceService', () => {
  let service: AttendanceService;

  const mockAttendanceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockSnapshotRepository = {
    find: jest.fn(),
  };

  const mockSessionRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(AttendanceRecord),
          useValue: mockAttendanceRepository,
        },
        {
          provide: getRepositoryToken(AttendanceSnapshot),
          useValue: mockSnapshotRepository,
        },
        {
          provide: getRepositoryToken(ClassSession),
          useValue: mockSessionRepository,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateAttendanceFromSnapshots', () => {
    const sessionId = 'session-uuid';
    const scheduledStart = new Date('2024-01-15T08:00:00Z');
    const scheduledEnd = new Date('2024-01-15T10:00:00Z');

    const mockSession = {
      id: sessionId,
      groupId: 'group-uuid',
      teacherId: 'teacher-uuid',
      classroomId: 'classroom-uuid',
      scheduledStart,
      scheduledEnd,
      status: SessionStatus.ACTIVE,
    };

    it('should calculate PRESENT status when permanence >= 80%', async () => {
      const studentId = 'student-1';

      // Create 10 snapshots, student detected in 9 (90% permanence)
      const snapshots = Array.from({ length: 10 }, (_, i) => ({
        id: `snapshot-${i}`,
        sessionId,
        timestamp: new Date(scheduledStart.getTime() + i * 60000), // Every minute
        detectedPersons: 1,
        occupancyRate: 90,
        confidence: 95,
        metadata: {
          detectedStudents: i < 9 ? [studentId] : [], // Present in first 9 snapshots
        },
      }));

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockSnapshotRepository.find.mockResolvedValue(snapshots);
      mockAttendanceRepository.findOne.mockResolvedValue(null);
      mockAttendanceRepository.create.mockImplementation((data) => data);
      mockAttendanceRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.calculateAttendanceFromSnapshots(sessionId);

      expect(result).toHaveLength(1);
      expect(result[0].studentId).toBe(studentId);
      expect(result[0].status).toBe(AttendanceStatus.PRESENT);
      expect(result[0].permanencePercentage).toBe(90);
      expect(result[0].origin).toBe(AttendanceOrigin.AI);
    });

    it('should calculate LATE status when arrival > 10 minutes after scheduled start', async () => {
      const studentId = 'student-1';
      const lateArrival = new Date(scheduledStart.getTime() + 15 * 60000); // 15 minutes late

      // Create 10 snapshots, 15 minutes apart. Student detected from the second snapshot onward.
      const snapshots = Array.from({ length: 10 }, (_, i) => {
        const timestamp = new Date(scheduledStart.getTime() + i * 15 * 60000);
        return {
          id: `snapshot-${i}`,
          sessionId,
          timestamp,
          detectedPersons: 1,
          occupancyRate: 85,
          confidence: 95,
          metadata: {
            detectedStudents: i >= 1 ? [studentId] : [],
          },
        };
      });

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockSnapshotRepository.find.mockResolvedValue(snapshots);
      mockAttendanceRepository.findOne.mockResolvedValue(null);
      mockAttendanceRepository.create.mockImplementation((data) => data);
      mockAttendanceRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.calculateAttendanceFromSnapshots(sessionId);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(AttendanceStatus.LATE);
      expect(result[0].arrivalTime).toEqual(lateArrival);
    });

    it('should calculate ABSENT status when permanence < 80%', async () => {
      const studentId = 'student-1';

      // Create 10 snapshots, student detected in only 5 (50% permanence)
      const snapshots = Array.from({ length: 10 }, (_, i) => ({
        id: `snapshot-${i}`,
        sessionId,
        timestamp: new Date(scheduledStart.getTime() + i * 60000),
        detectedPersons: 1,
        occupancyRate: 50,
        confidence: 95,
        metadata: {
          detectedStudents: i < 5 ? [studentId] : [], // Only first 5 snapshots
        },
      }));

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockSnapshotRepository.find.mockResolvedValue(snapshots);
      mockAttendanceRepository.findOne.mockResolvedValue(null);
      mockAttendanceRepository.create.mockImplementation((data) => data);
      mockAttendanceRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.calculateAttendanceFromSnapshots(sessionId);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(AttendanceStatus.ABSENT);
      expect(result[0].permanencePercentage).toBe(50);
    });

    it('should not update manually corrected records', async () => {
      const studentId = 'student-1';
      const existingRecord = {
        id: 'record-uuid',
        sessionId,
        studentId,
        status: AttendanceStatus.EXCUSED,
        permanencePercentage: 0,
        origin: AttendanceOrigin.MANUAL,
        manualCorrection: true,
      };

      const snapshots = Array.from({ length: 10 }, (_, i) => ({
        id: `snapshot-${i}`,
        sessionId,
        timestamp: new Date(scheduledStart.getTime() + i * 60000),
        detectedPersons: 1,
        occupancyRate: 90,
        confidence: 95,
        metadata: {
          detectedStudents: [studentId],
        },
      }));

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockSnapshotRepository.find.mockResolvedValue(snapshots);
      mockAttendanceRepository.findOne.mockResolvedValue(existingRecord);
      mockAttendanceRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.calculateAttendanceFromSnapshots(sessionId);

      // Should not change the manually corrected status
      expect(result[0].status).toBe(AttendanceStatus.EXCUSED);
      expect(result[0].manualCorrection).toBe(true);
    });

    it('should throw NotFoundException if session does not exist', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(service.calculateAttendanceFromSnapshots('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('applyManualCorrection', () => {
    const sessionId = 'session-uuid';
    const studentId = 'student-1';

    it('should create new record with MANUAL origin if record does not exist', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(null);
      mockAttendanceRepository.create.mockImplementation((data) => data);
      mockAttendanceRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.applyManualCorrection(
        sessionId,
        studentId,
        AttendanceStatus.EXCUSED,
      );

      expect(result.status).toBe(AttendanceStatus.EXCUSED);
      expect(result.origin).toBe(AttendanceOrigin.MANUAL);
      expect(result.manualCorrection).toBe(true);
    });

    it('should update existing AI record to MIXED origin', async () => {
      const existingRecord = {
        id: 'record-uuid',
        sessionId,
        studentId,
        status: AttendanceStatus.PRESENT,
        permanencePercentage: 90,
        origin: AttendanceOrigin.AI,
        manualCorrection: false,
      };

      mockAttendanceRepository.findOne.mockResolvedValue(existingRecord);
      mockAttendanceRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.applyManualCorrection(
        sessionId,
        studentId,
        AttendanceStatus.LATE,
      );

      expect(result.status).toBe(AttendanceStatus.LATE);
      expect(result.origin).toBe(AttendanceOrigin.MIXED);
      expect(result.manualCorrection).toBe(true);
    });

    it('should update arrival time when provided', async () => {
      const arrivalTime = new Date('2024-01-15T08:15:00Z');

      mockAttendanceRepository.findOne.mockResolvedValue(null);
      mockAttendanceRepository.create.mockImplementation((data) => data);
      mockAttendanceRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.applyManualCorrection(
        sessionId,
        studentId,
        AttendanceStatus.LATE,
        arrivalTime,
      );

      expect(result.arrivalTime).toEqual(arrivalTime);
    });
  });

  describe('getAttendanceBySession', () => {
    it('should return all attendance records for a session', async () => {
      const sessionId = 'session-uuid';
      const mockRecords = [
        { id: 'record-1', sessionId, studentId: 'student-1', status: AttendanceStatus.PRESENT },
        { id: 'record-2', sessionId, studentId: 'student-2', status: AttendanceStatus.LATE },
      ];

      mockAttendanceRepository.find.mockResolvedValue(mockRecords);

      const result = await service.getAttendanceBySession(sessionId);

      expect(result).toHaveLength(2);
      expect(mockAttendanceRepository.find).toHaveBeenCalledWith({
        where: { sessionId },
        order: { createdAt: 'ASC' },
      });
    });
  });
});
