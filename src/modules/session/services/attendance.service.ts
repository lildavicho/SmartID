import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { AttendanceSnapshot } from '../entities/attendance-snapshot.entity';
import { ClassSession } from '../entities/class-session.entity';
import { AttendanceStatus } from '../enums/attendance-status.enum';
import { AttendanceOrigin } from '../enums/attendance-origin.enum';

@Injectable()
export class AttendanceService {
  // Business rules constants
  private readonly LATE_THRESHOLD_MINUTES = 10;
  private readonly PRESENT_THRESHOLD_PERCENTAGE = 80;

  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(AttendanceSnapshot)
    private readonly snapshotRepository: Repository<AttendanceSnapshot>,
    @InjectRepository(ClassSession)
    private readonly sessionRepository: Repository<ClassSession>,
  ) {}

  async calculateAttendanceFromSnapshots(sessionId: string): Promise<AttendanceRecord[]> {
    try {
      // Get session details with relations to avoid N+1 queries
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
        relations: ['group', 'group.course'],
      });

      if (!session) {
        throw new NotFoundException(`Session with ID ${sessionId} not found`);
      }

    // Get all snapshots for this session
    const snapshots = await this.snapshotRepository.find({
      where: { sessionId },
      order: { timestamp: 'ASC' },
    });

    if (snapshots.length === 0) {
      return [];
    }

    // In a real implementation, snapshots would contain student detection data
    // For now, we'll create a mock implementation that demonstrates the logic
    // You would need to extend the metadata field to include detected student IDs

    // Mock: Get enrolled students from the group (this would come from enrollment service)
    // For demonstration, we'll assume metadata contains studentIds array
    const studentAttendanceMap = new Map<
      string,
      {
        detectionCount: number;
        firstDetection: Date;
        totalSnapshots: number;
      }
    >();

    const totalSnapshots = snapshots.length;

    // Process each snapshot
    for (const snapshot of snapshots) {
      // In real implementation, snapshot.metadata would contain detected student IDs
      const detectedStudents = (snapshot.metadata?.detectedStudents || []) as string[];

      for (const studentId of detectedStudents) {
        if (!studentAttendanceMap.has(studentId)) {
          studentAttendanceMap.set(studentId, {
            detectionCount: 0,
            firstDetection: snapshot.timestamp,
            totalSnapshots,
          });
        }

        const attendance = studentAttendanceMap.get(studentId)!;
        attendance.detectionCount++;
      }
    }

    // Calculate attendance records
    const attendanceRecords: AttendanceRecord[] = [];

    for (const [studentId, data] of studentAttendanceMap.entries()) {
      const permanencePercentage = (data.detectionCount / data.totalSnapshots) * 100;

      // Determine status based on business rules
      let status = AttendanceStatus.ABSENT;
      let arrivalTime: Date | null = null;

      if (permanencePercentage >= this.PRESENT_THRESHOLD_PERCENTAGE) {
        // Check if late
        const scheduledStart = new Date(session.scheduledStart);
        const lateThreshold = new Date(
          scheduledStart.getTime() + this.LATE_THRESHOLD_MINUTES * 60000,
        );

        if (data.firstDetection > lateThreshold) {
          status = AttendanceStatus.LATE;
        } else {
          status = AttendanceStatus.PRESENT;
        }
        arrivalTime = data.firstDetection;
      }

      // Check if record already exists
      let record = await this.attendanceRepository.findOne({
        where: { sessionId, studentId },
      });

      if (record) {
        // Update existing record only if not manually corrected
        if (!record.manualCorrection) {
          record.status = status;
          record.arrivalTime = arrivalTime;
          record.permanencePercentage = permanencePercentage;
          record.origin = AttendanceOrigin.AI;
        }
      } else {
        // Create new record
        record = this.attendanceRepository.create({
          sessionId,
          studentId,
          status,
          arrivalTime,
          permanencePercentage,
          origin: AttendanceOrigin.AI,
          manualCorrection: false,
        });
      }

      const savedRecord = await this.attendanceRepository.save(record);
      attendanceRecords.push(savedRecord);
    }

    return attendanceRecords;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to calculate attendance: ${error.message}`);
    }
  }

  async applyManualCorrection(
    sessionId: string,
    studentId: string,
    newStatus: AttendanceStatus,
    arrivalTime?: Date,
  ): Promise<AttendanceRecord> {
    let record = await this.attendanceRepository.findOne({
      where: { sessionId, studentId },
    });

    if (!record) {
      // Create new record if it doesn't exist
      record = this.attendanceRepository.create({
        sessionId,
        studentId,
        status: newStatus,
        arrivalTime: arrivalTime || null,
        permanencePercentage: 0,
        origin: AttendanceOrigin.MANUAL,
        manualCorrection: true,
      });
    } else {
      // Update existing record
      const wasManual = record.origin === AttendanceOrigin.MANUAL;
      const wasAI = record.origin === AttendanceOrigin.AI;

      record.status = newStatus;
      if (arrivalTime) {
        record.arrivalTime = arrivalTime;
      }
      record.manualCorrection = true;

      // Update origin
      if (wasAI && !wasManual) {
        record.origin = AttendanceOrigin.MIXED;
      } else if (!wasAI && !wasManual) {
        record.origin = AttendanceOrigin.MANUAL;
      }
    }

    return await this.attendanceRepository.save(record);
  }

  async getAttendanceBySession(sessionId: string): Promise<AttendanceRecord[]> {
    return await this.attendanceRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async getAttendanceRecord(
    sessionId: string,
    studentId: string,
  ): Promise<AttendanceRecord | null> {
    return await this.attendanceRepository.findOne({
      where: { sessionId, studentId },
    });
  }
}
