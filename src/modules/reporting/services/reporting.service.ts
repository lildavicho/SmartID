import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AttendanceRecord } from '../../session/entities/attendance-record.entity';
import { ClassSession } from '../../session/entities/class-session.entity';
import {
  DailyAttendanceReport,
  GroupAttendanceSummary,
  CourseReport,
  StudentAttendanceStats,
  TeacherReport,
  TeacherCourseStats,
} from '../types/report-data.type';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(ClassSession)
    private readonly sessionRepository: Repository<ClassSession>,
  ) {}

  /**
   * Generate daily attendance report for an institution
   */
  async generateDailyAttendanceReport(
    institutionId: string,
    date: string,
  ): Promise<DailyAttendanceReport> {
    this.logger.log(`Generating daily attendance report for ${institutionId} on ${date}`);

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get all sessions for the day
    const sessions = await this.sessionRepository.find({
      where: {
        scheduledStart: Between(startOfDay, endOfDay),
      },
      relations: ['attendanceRecords'],
    });

    // TODO: Filter by institutionId through group/course relationship
    // For now, we'll process all sessions

    // Group attendance records by group
    const groupMap = new Map<string, GroupAttendanceSummary>();

    for (const session of sessions) {
      const groupId = session.groupId;

      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          groupId,
          groupName: `Group ${groupId.substring(0, 8)}`, // TODO: Get actual group name
          courseName: 'Course Name', // TODO: Get actual course name
          totalStudents: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendanceRate: 0,
        });
      }

      const groupSummary = groupMap.get(groupId)!;

      // Count attendance by status
      for (const record of session.attendanceRecords || []) {
        groupSummary.totalStudents++;

        switch (record.status) {
          case 'PRESENT':
            groupSummary.present++;
            break;
          case 'ABSENT':
            groupSummary.absent++;
            break;
          case 'LATE':
            groupSummary.late++;
            break;
          case 'EXCUSED':
            groupSummary.excused++;
            break;
        }
      }

      // Calculate attendance rate
      if (groupSummary.totalStudents > 0) {
        groupSummary.attendanceRate =
          ((groupSummary.present + groupSummary.late) / groupSummary.totalStudents) * 100;
      }
    }

    const groups = Array.from(groupMap.values());

    // Calculate totals
    const totals = groups.reduce(
      (acc, group) => ({
        totalStudents: acc.totalStudents + group.totalStudents,
        totalPresent: acc.totalPresent + group.present,
        totalAbsent: acc.totalAbsent + group.absent,
        totalLate: acc.totalLate + group.late,
        totalExcused: acc.totalExcused + group.excused,
      }),
      { totalStudents: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0, totalExcused: 0 },
    );

    const attendanceRate =
      totals.totalStudents > 0
        ? ((totals.totalPresent + totals.totalLate) / totals.totalStudents) * 100
        : 0;

    return {
      institutionId,
      date,
      ...totals,
      attendanceRate,
      groups,
    };
  }

  /**
   * Generate course report for a specific group over a date range
   */
  async generateCourseReport(
    groupId: string,
    startDate: string,
    endDate: string,
  ): Promise<CourseReport> {
    this.logger.log(
      `Generating course report for group ${groupId} from ${startDate} to ${endDate}`,
    );

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all sessions for the group in date range
    const sessions = await this.sessionRepository.find({
      where: {
        groupId,
        scheduledStart: Between(start, end),
      },
      relations: ['attendanceRecords'],
    });

    // Map to track student statistics
    const studentMap = new Map<string, StudentAttendanceStats>();

    for (const session of sessions) {
      for (const record of session.attendanceRecords || []) {
        if (!studentMap.has(record.studentId)) {
          studentMap.set(record.studentId, {
            studentId: record.studentId,
            studentName: `Student ${record.studentId.substring(0, 8)}`, // TODO: Get actual name
            studentCode: 'STU-XXX', // TODO: Get actual code
            totalSessions: 0,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            excusedCount: 0,
            attendancePercentage: 0,
            permanenceAverage: 0,
          });
        }

        const stats = studentMap.get(record.studentId)!;
        stats.totalSessions++;

        switch (record.status) {
          case 'PRESENT':
            stats.presentCount++;
            break;
          case 'ABSENT':
            stats.absentCount++;
            break;
          case 'LATE':
            stats.lateCount++;
            break;
          case 'EXCUSED':
            stats.excusedCount++;
            break;
        }

        // Add permanence percentage
        stats.permanenceAverage += Number(record.permanencePercentage || 0);
      }
    }

    // Calculate final statistics
    const students = Array.from(studentMap.values()).map((student) => {
      if (student.totalSessions > 0) {
        student.attendancePercentage =
          ((student.presentCount + student.lateCount) / student.totalSessions) * 100;
        student.permanenceAverage = student.permanenceAverage / student.totalSessions;
      }
      return student;
    });

    return {
      groupId,
      groupName: `Group ${groupId.substring(0, 8)}`, // TODO: Get actual name
      courseName: 'Course Name', // TODO: Get actual course name
      startDate,
      endDate,
      totalSessions: sessions.length,
      students,
    };
  }

  /**
   * Generate teacher report for a specific month
   */
  async generateTeacherReport(
    teacherId: string,
    month: number,
    year: number,
  ): Promise<TeacherReport> {
    this.logger.log(`Generating teacher report for ${teacherId} - ${month}/${year}`);

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all sessions for the teacher in the month
    const sessions = await this.sessionRepository.find({
      where: {
        teacherId,
        scheduledStart: Between(startDate, endDate),
      },
      relations: ['attendanceRecords'],
    });

    // Group by course/group
    const courseMap = new Map<string, TeacherCourseStats>();

    for (const session of sessions) {
      const groupId = session.groupId;

      if (!courseMap.has(groupId)) {
        courseMap.set(groupId, {
          groupId,
          groupName: `Group ${groupId.substring(0, 8)}`, // TODO: Get actual name
          courseName: 'Course Name', // TODO: Get actual course name
          sessionsCount: 0,
          averageAttendanceRate: 0,
          totalStudents: 0,
        });
      }

      const courseStats = courseMap.get(groupId)!;
      courseStats.sessionsCount++;

      // Calculate attendance rate for this session
      const totalRecords = session.attendanceRecords?.length || 0;
      if (totalRecords > 0) {
        const presentCount = session.attendanceRecords!.filter(
          (r) => r.status === 'PRESENT' || r.status === 'LATE',
        ).length;

        const sessionRate = (presentCount / totalRecords) * 100;
        courseStats.averageAttendanceRate += sessionRate;
        courseStats.totalStudents = Math.max(courseStats.totalStudents, totalRecords);
      }
    }

    // Calculate averages
    const courses = Array.from(courseMap.values()).map((course) => {
      if (course.sessionsCount > 0) {
        course.averageAttendanceRate = course.averageAttendanceRate / course.sessionsCount;
      }
      return course;
    });

    return {
      teacherId,
      teacherName: `Teacher ${teacherId.substring(0, 8)}`, // TODO: Get actual name
      month,
      year,
      totalSessions: sessions.length,
      courses,
    };
  }
}
