import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ClassSession } from '../entities/class-session.entity';
import { SessionStatus } from '../enums/session-status.enum';
import { StartSessionDto } from '../dto/start-session.dto';
import { CloseSessionDto } from '../dto/close-session.dto';
import { SessionFiltersDto } from '../dto/session-filters.dto';
import { AttendanceService } from './attendance.service';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(ClassSession)
    private readonly sessionRepository: Repository<ClassSession>,
    private readonly attendanceService: AttendanceService,
  ) {}

  async startSession(startSessionDto: StartSessionDto): Promise<ClassSession> {
    const { groupId, teacherId, classroomId, deviceId, scheduledStart, scheduledEnd } =
      startSessionDto;

    // Create session with ACTIVE status
    const session = this.sessionRepository.create({
      groupId,
      teacherId,
      classroomId,
      deviceId,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      actualStart: new Date(), // Set to current time
      status: SessionStatus.ACTIVE,
    });

    return await this.sessionRepository.save(session);
  }

  async closeSession(closeSessionDto: CloseSessionDto): Promise<ClassSession> {
    const { sessionId, manualCorrections } = closeSessionDto;

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.status === SessionStatus.CLOSED) {
      throw new BadRequestException('Session is already closed');
    }

    // Calculate attendance from snapshots before closing
    await this.attendanceService.calculateAttendanceFromSnapshots(sessionId);

    // Apply manual corrections if provided
    if (manualCorrections && manualCorrections.length > 0) {
      for (const correction of manualCorrections) {
        await this.attendanceService.applyManualCorrection(
          sessionId,
          correction.studentId,
          correction.status,
          correction.arrivalTime ? new Date(correction.arrivalTime) : undefined,
        );
      }
    }

    // Update session status
    session.status = SessionStatus.CLOSED;
    session.actualEnd = new Date();

    return await this.sessionRepository.save(session);
  }

  async getSessionDetails(sessionId: string): Promise<ClassSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['snapshots', 'attendanceRecords'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    return session;
  }

  async findAll(filters?: SessionFiltersDto): Promise<ClassSession[]> {
    const where: any = {};

    if (filters) {
      if (filters.groupId) {
        where.groupId = filters.groupId;
      }

      if (filters.teacherId) {
        where.teacherId = filters.teacherId;
      }

      if (filters.startDate && filters.endDate) {
        where.scheduledStart = Between(new Date(filters.startDate), new Date(filters.endDate));
      } else if (filters.startDate) {
        where.scheduledStart = new Date(filters.startDate);
      }
    }

    return await this.sessionRepository.find({
      where,
      order: { scheduledStart: 'DESC' },
      relations: ['snapshots', 'attendanceRecords'],
    });
  }

  async findOne(id: string): Promise<ClassSession> {
    return await this.getSessionDetails(id);
  }

  async cancelSession(sessionId: string): Promise<ClassSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.status === SessionStatus.CLOSED) {
      throw new BadRequestException('Cannot cancel a closed session');
    }

    session.status = SessionStatus.CANCELLED;
    return await this.sessionRepository.save(session);
  }
}
