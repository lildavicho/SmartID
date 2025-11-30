import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ClassSession } from '../entities/class-session.entity';
import { SessionStatus } from '../enums/session-status.enum';
import { StartSessionDto } from '../dto/start-session.dto';
import { CloseSessionDto } from '../dto/close-session.dto';
import { SessionFiltersDto } from '../dto/session-filters.dto';
import { SendSnapshotDto } from '../dto/snapshot.dto';
import { AttendanceService } from './attendance.service';
import { SnapshotService } from './snapshot.service';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(ClassSession)
    private readonly sessionRepository: Repository<ClassSession>,
    private readonly attendanceService: AttendanceService,
    private readonly snapshotService: SnapshotService,
  ) {}

  async startSession(startSessionDto: StartSessionDto, teacherId: string): Promise<ClassSession> {
    try {
      const { groupId, classroomId, scheduledStart, scheduledEnd } = startSessionDto;

      // Check if teacher already has an active session
      const activeSession = await this.sessionRepository.findOne({
        where: { teacherId, status: SessionStatus.IN_PROGRESS },
      });

      if (activeSession) {
        throw new BadRequestException('Ya tienes una sesión activa');
      }

      // Create session with IN_PROGRESS status
      const session = this.sessionRepository.create({
        groupId,
        teacherId,
        classroomId,
        scheduledStart: scheduledStart ? new Date(scheduledStart) : new Date(),
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : new Date(Date.now() + 2 * 60 * 60 * 1000), // Default 2 hours
        actualStart: new Date(), // Set to current time
        status: SessionStatus.IN_PROGRESS,
      });

      return await this.sessionRepository.save(session);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }

  async startExistingSession(sessionId: string, teacherId: string): Promise<ClassSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Validate teacher ownership
    if (session.teacherId !== teacherId) {
      throw new BadRequestException('You are not authorized to start this session');
    }

    // Validate session status
    if (session.status !== SessionStatus.PENDING) {
      throw new BadRequestException(`Cannot start session with status ${session.status}`);
    }

    // Update session to IN_PROGRESS
    session.status = SessionStatus.IN_PROGRESS;
    session.actualStart = new Date();

    return await this.sessionRepository.save(session);
  }

  async closeSession(
    closeSessionDto: CloseSessionDto,
    teacherId: string,
  ): Promise<ClassSession> {
    try {
      const { sessionId, manualCorrections } = closeSessionDto;

      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundException(`Session with ID ${sessionId} not found`);
      }

      // Validate teacher ownership
      if (session.teacherId !== teacherId) {
        throw new BadRequestException('You are not authorized to close this session');
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
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to close session');
    }
  }

  async getSessionDetails(sessionId: string): Promise<ClassSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['snapshots', 'attendanceRecords', 'group', 'group.course', 'teacher', 'classroom'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    return session;
  }

  async findAll(filters?: SessionFiltersDto): Promise<ClassSession[]> {
    const queryBuilder = this.sessionRepository.createQueryBuilder('session');

    if (filters) {
      if (filters.groupId) {
        queryBuilder.andWhere('session.groupId = :groupId', { groupId: filters.groupId });
      }

      if (filters.teacherId) {
        queryBuilder.andWhere('session.teacherId = :teacherId', { teacherId: filters.teacherId });
      }

      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere('session.scheduledStart BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate,
        });
      } else if (filters.startDate) {
        queryBuilder.andWhere('session.scheduledStart >= :startDate', {
          startDate: filters.startDate,
        });
      }
    }

    queryBuilder
      .leftJoinAndSelect('session.snapshots', 'snapshots')
      .leftJoinAndSelect('session.attendanceRecords', 'attendanceRecords')
      .leftJoinAndSelect('session.group', 'group')
      .leftJoinAndSelect('group.course', 'course')
      .orderBy('session.scheduledStart', 'DESC');

    return await queryBuilder.getMany();
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

  /**
   * Get active session for a specific teacher
   * Retorna null si no hay sesión activa (no lanza excepción)
   */
  async getActiveSessionForTeacher(teacherId: string): Promise<ClassSession | null> {
    try {
      const session = await this.sessionRepository.findOne({
        where: { teacherId, status: SessionStatus.IN_PROGRESS },
        relations: ['group', 'group.course', 'classroom'],
        order: { actualStart: 'DESC' },
      });

      if (session) {
        this.logger.log(
          `Sesión activa encontrada para teacherId ${teacherId}: ${session.id}`,
        );
      } else {
        this.logger.log(`No hay sesión activa para teacherId ${teacherId}`);
      }

      return session;
    } catch (error) {
      this.logger.error(
        `Error al buscar sesión activa para teacherId ${teacherId}: ${error.message}`,
      );
      // Retorna null en lugar de lanzar excepción
      return null;
    }
  }

  /**
   * Record snapshot from Android app
   */
  async recordSnapshot(sendSnapshotDto: SendSnapshotDto) {
    const { sessionId, detectedPersons, confidence, detectedStudentIds } = sendSnapshotDto;

    // Convert SendSnapshotDto to CreateSnapshotDto format
    const createSnapshotDto = {
      sessionId,
      detectedPersons,
      occupancyRate: detectedPersons, // Use detectedPersons as occupancyRate
      confidence,
      metadata: detectedStudentIds ? { detectedStudents: detectedStudentIds } : undefined,
    };

    return await this.snapshotService.createSnapshot(createSnapshotDto);
  }

  /**
   * Get upcoming sessions for a specific teacher
   * Returns sessions scheduled for today or future dates
   * Only includes SCHEDULED and ACTIVE sessions (camera-based attendance)
   */
  async getUpcomingSessions(teacherId: string): Promise<
    Array<{
      id: string;
      courseName: string;
      groupName: string;
      classroomName: string;
      startTime: Date;
      endTime: Date;
      status: SessionStatus;
      deviceId: string | null;
    }>
  > {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.group', 'group')
      .leftJoinAndSelect('group.course', 'course')
      .leftJoinAndSelect('session.classroom', 'classroom')
      .where('session.teacherId = :teacherId', { teacherId })
      .andWhere('session.scheduledStart >= :today', { today })
      .andWhere('session.status IN (:...statuses)', {
        statuses: [SessionStatus.PENDING, SessionStatus.IN_PROGRESS],
      })
      .orderBy('session.scheduledStart', 'ASC')
      .getMany();

    // Transform to include required fields
    return sessions.map((session) => ({
      id: session.id,
      courseName: session.group?.course?.name || 'Unknown Course',
      groupName: session.group?.name || 'Unknown Group',
      classroomName: session.classroom?.name || 'Unknown Classroom',
      startTime: session.scheduledStart,
      endTime: session.scheduledEnd,
      status: session.status,
      deviceId: session.deviceId,
    }));
  }
}
