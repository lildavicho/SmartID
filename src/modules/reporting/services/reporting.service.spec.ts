import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportingService } from './reporting.service';
import { AttendanceRecord } from '../../session/entities/attendance-record.entity';
import { ClassSession } from '../../session/entities/class-session.entity';

describe('ReportingService', () => {
  let service: ReportingService;

  const mockAttendanceRepository = {
    find: jest.fn(),
  };

  const mockSessionRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        {
          provide: getRepositoryToken(AttendanceRecord),
          useValue: mockAttendanceRepository,
        },
        {
          provide: getRepositoryToken(ClassSession),
          useValue: mockSessionRepository,
        },
      ],
    }).compile();

    service = module.get<ReportingService>(ReportingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateDailyAttendanceReport', () => {
    it('should generate daily report with correct totals', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          groupId: 'group-1',
          scheduledStart: new Date('2025-01-15T08:00:00Z'),
          attendanceRecords: [
            { studentId: 'student-1', status: 'PRESENT', permanencePercentage: 95 },
            { studentId: 'student-2', status: 'ABSENT', permanencePercentage: 0 },
            { studentId: 'student-3', status: 'LATE', permanencePercentage: 85 },
          ],
        },
        {
          id: 'session-2',
          groupId: 'group-2',
          scheduledStart: new Date('2025-01-15T10:00:00Z'),
          attendanceRecords: [
            { studentId: 'student-4', status: 'PRESENT', permanencePercentage: 100 },
            { studentId: 'student-5', status: 'PRESENT', permanencePercentage: 90 },
          ],
        },
      ];

      mockSessionRepository.find.mockResolvedValue(mockSessions);

      const result = await service.generateDailyAttendanceReport('institution-uuid', '2025-01-15');

      expect(result.totalStudents).toBe(5);
      expect(result.totalPresent).toBe(3);
      expect(result.totalAbsent).toBe(1);
      expect(result.totalLate).toBe(1);
      expect(result.groups).toHaveLength(2);
    });

    it('should calculate attendance rate correctly', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          groupId: 'group-1',
          scheduledStart: new Date('2025-01-15T08:00:00Z'),
          attendanceRecords: [
            { studentId: 'student-1', status: 'PRESENT', permanencePercentage: 95 },
            { studentId: 'student-2', status: 'PRESENT', permanencePercentage: 90 },
            { studentId: 'student-3', status: 'ABSENT', permanencePercentage: 0 },
            { studentId: 'student-4', status: 'ABSENT', permanencePercentage: 0 },
          ],
        },
      ];

      mockSessionRepository.find.mockResolvedValue(mockSessions);

      const result = await service.generateDailyAttendanceReport('institution-uuid', '2025-01-15');

      // 2 present out of 4 = 50%
      expect(result.attendanceRate).toBe(50);
    });
  });

  describe('generateCourseReport', () => {
    it('should generate course report with student statistics', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          groupId: 'group-1',
          scheduledStart: new Date('2025-01-01T08:00:00Z'),
          attendanceRecords: [
            { studentId: 'student-1', status: 'PRESENT', permanencePercentage: 95 },
            { studentId: 'student-2', status: 'ABSENT', permanencePercentage: 0 },
          ],
        },
        {
          id: 'session-2',
          groupId: 'group-1',
          scheduledStart: new Date('2025-01-02T08:00:00Z'),
          attendanceRecords: [
            { studentId: 'student-1', status: 'PRESENT', permanencePercentage: 100 },
            { studentId: 'student-2', status: 'LATE', permanencePercentage: 70 },
          ],
        },
      ];

      mockSessionRepository.find.mockResolvedValue(mockSessions);

      const result = await service.generateCourseReport('group-1', '2025-01-01', '2025-01-31');

      expect(result.totalSessions).toBe(2);
      expect(result.students).toHaveLength(2);

      const student1 = result.students.find((s) => s.studentId === 'student-1');
      expect(student1?.presentCount).toBe(2);
      expect(student1?.attendancePercentage).toBe(100);

      const student2 = result.students.find((s) => s.studentId === 'student-2');
      expect(student2?.absentCount).toBe(1);
      expect(student2?.lateCount).toBe(1);
      expect(student2?.attendancePercentage).toBe(50);
    });
  });

  describe('generateTeacherReport', () => {
    it('should generate teacher report with course statistics', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          groupId: 'group-1',
          teacherId: 'teacher-1',
          scheduledStart: new Date('2025-01-15T08:00:00Z'),
          attendanceRecords: [
            { studentId: 'student-1', status: 'PRESENT', permanencePercentage: 95 },
            { studentId: 'student-2', status: 'PRESENT', permanencePercentage: 90 },
          ],
        },
        {
          id: 'session-2',
          groupId: 'group-1',
          teacherId: 'teacher-1',
          scheduledStart: new Date('2025-01-16T08:00:00Z'),
          attendanceRecords: [
            { studentId: 'student-1', status: 'ABSENT', permanencePercentage: 0 },
            { studentId: 'student-2', status: 'PRESENT', permanencePercentage: 100 },
          ],
        },
      ];

      mockSessionRepository.find.mockResolvedValue(mockSessions);

      const result = await service.generateTeacherReport('teacher-1', 1, 2025);

      expect(result.totalSessions).toBe(2);
      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].sessionsCount).toBe(2);
    });
  });
});
