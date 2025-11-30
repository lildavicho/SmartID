import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { DailyAttendanceReport } from '../types';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportService],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportToExcel', () => {
    it('should generate Excel buffer for daily report', async () => {
      const mockData: DailyAttendanceReport = {
        institutionId: 'institution-uuid',
        date: '2025-01-15',
        totalStudents: 10,
        totalPresent: 8,
        totalAbsent: 1,
        totalLate: 1,
        totalExcused: 0,
        attendanceRate: 90,
        groups: [
          {
            groupId: 'group-1',
            groupName: 'Group A',
            courseName: 'Mathematics',
            totalStudents: 10,
            present: 8,
            absent: 1,
            late: 1,
            excused: 0,
            attendanceRate: 90,
          },
        ],
      };

      const buffer = await service.exportToExcel(mockData, 'daily');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should throw error for unknown report type', async () => {
      const mockReport: DailyAttendanceReport = {
        date: '2024-01-15',
        institutionId: 'inst-1',
        totalStudents: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        totalExcused: 0,
        attendanceRate: 0,
        groups: [],
      };
      await expect(service.exportToExcel(mockReport, 'unknown' as any)).rejects.toThrow(
        'Unknown report type: unknown',
      );
    });
  });

  describe('exportToPDF', () => {
    it('should generate PDF buffer for daily report', async () => {
      const mockData: DailyAttendanceReport = {
        institutionId: 'institution-uuid',
        date: '2025-01-15',
        totalStudents: 10,
        totalPresent: 8,
        totalAbsent: 1,
        totalLate: 1,
        totalExcused: 0,
        attendanceRate: 90,
        groups: [
          {
            groupId: 'group-1',
            groupName: 'Group A',
            courseName: 'Mathematics',
            totalStudents: 10,
            present: 8,
            absent: 1,
            late: 1,
            excused: 0,
            attendanceRate: 90,
          },
        ],
      };

      const buffer = await service.exportToPDF(mockData, 'daily');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Check PDF header
      const pdfHeader = buffer.toString('utf8', 0, 5);
      expect(pdfHeader).toBe('%PDF-');
    });
  });
});
