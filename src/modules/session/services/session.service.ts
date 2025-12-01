import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ClassSession } from '../entities/class-session.entity';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { Enrollment } from '../../academic/entities/enrollment.entity';
import { SessionStatus } from '../enums/session-status.enum';
import { AttendanceStatus } from '../enums/attendance-status.enum';
import { AttendanceOrigin } from '../enums/attendance-origin.enum';
import { AttendanceSource } from '../enums/attendance-source.enum';
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
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRecordRepository: Repository<AttendanceRecord>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly attendanceService: AttendanceService,
    private readonly snapshotService: SnapshotService,
  ) {}

  /**
   * Abre una nueva sesión para un profesor
   * REGLA: Un profesor no puede tener más de una sesión IN_PROGRESS a la vez
   * 
   * @param startSessionDto Datos de la sesión
   * @param teacherId ID del profesor
   * @param deviceId ID del dispositivo (opcional)
   * @returns Sesión creada
   */
  async openSessionForTeacher(
    startSessionDto: StartSessionDto,
    teacherId: string,
    deviceId?: string,
  ): Promise<ClassSession> {
    try {
      const { groupId, classroomId, scheduledStart, scheduledEnd } = startSessionDto;

      // Verificar si el profesor ya tiene una sesión activa
      const activeSession = await this.sessionRepository.findOne({
        where: { teacherId, status: SessionStatus.IN_PROGRESS },
      });

      if (activeSession) {
        this.logger.warn(
          `Intento de abrir sesión cuando ya existe una activa. TeacherId: ${teacherId}, Sesión activa: ${activeSession.id}`,
        );
        throw new BadRequestException('Ya tienes una sesión activa. Debes cerrarla antes de abrir una nueva.');
      }

      // Crear sesión con status IN_PROGRESS
      const now = new Date();
      const session = this.sessionRepository.create({
        groupId,
        teacherId,
        classroomId,
        deviceId: deviceId || null,
        scheduledStart: scheduledStart ? new Date(scheduledStart) : now,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : new Date(now.getTime() + 2 * 60 * 60 * 1000), // Default 2 horas
        actualStart: now,
        status: SessionStatus.IN_PROGRESS,
        createdBy: teacherId,
        updatedBy: teacherId,
      });

      const savedSession = await this.sessionRepository.save(session);

      this.logger.log(
        `Sesión abierta exitosamente. SessionId: ${savedSession.id}, TeacherId: ${teacherId}, GroupId: ${groupId}`,
      );

      return savedSession;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error al abrir sesión para teacherId ${teacherId}: ${error.message}`);
      throw new BadRequestException('Error al abrir sesión');
    }
  }

  /**
   * Alias para compatibilidad con código existente
   */
  async startSession(startSessionDto: StartSessionDto, teacherId: string): Promise<ClassSession> {
    return this.openSessionForTeacher(startSessionDto, teacherId);
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

  /**
   * Finaliza una sesión de clase
   * 
   * @param sessionId ID de la sesión
   * @param finishedBy ID del usuario que finaliza la sesión (opcional, por defecto el profesor)
   * @param teacherId ID del profesor (para validación de autorización)
   * @returns Sesión finalizada
   */
  async finishSession(
    sessionId: string,
    teacherId: string,
    finishedBy?: string,
  ): Promise<ClassSession> {
    try {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
        relations: ['group', 'teacher'],
      });

      if (!session) {
        throw new NotFoundException(`Sesión con ID ${sessionId} no encontrada`);
      }

      // Validar que el profesor es el dueño de la sesión
      if (session.teacherId !== teacherId) {
        this.logger.warn(
          `Intento de finalizar sesión no autorizado. SessionId: ${sessionId}, TeacherId solicitante: ${teacherId}, TeacherId dueño: ${session.teacherId}`,
        );
        throw new BadRequestException('No estás autorizado para finalizar esta sesión');
      }

      // Validar estado de la sesión
      if (session.status === SessionStatus.FINISHED || session.status === SessionStatus.CLOSED) {
        throw new BadRequestException(`La sesión ya está finalizada (status: ${session.status})`);
      }

      if (session.status === SessionStatus.CANCELLED) {
        throw new BadRequestException('No se puede finalizar una sesión cancelada');
      }

      // Calcular asistencia desde snapshots antes de cerrar
      try {
        await this.attendanceService.calculateAttendanceFromSnapshots(sessionId);
      } catch (error) {
        this.logger.warn(`Error al calcular asistencia para sesión ${sessionId}: ${error.message}`);
        // Continuar aunque falle el cálculo de asistencia
      }

      // Marcar como ABSENT a estudiantes que no tienen registro de asistencia
      await this.markAbsentStudents(sessionId, session.groupId);

      // Actualizar estado de la sesión
      session.status = SessionStatus.FINISHED;
      session.actualEnd = new Date();
      session.updatedBy = finishedBy || teacherId;

      const savedSession = await this.sessionRepository.save(session);

      this.logger.log(
        `Sesión finalizada exitosamente. SessionId: ${savedSession.id}, TeacherId: ${teacherId}, GroupId: ${session.groupId}`,
      );

      return savedSession;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error al finalizar sesión ${sessionId}: ${error.message}`);
      throw new BadRequestException('Error al finalizar sesión');
    }
  }

  /**
   * Alias para compatibilidad con código existente
   */
  async closeSession(
    closeSessionDto: CloseSessionDto,
    teacherId: string,
  ): Promise<ClassSession> {
    const { sessionId, manualCorrections } = closeSessionDto;

    // Aplicar correcciones manuales si se proporcionan
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

    return this.finishSession(sessionId, teacherId);
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

  /**
   * Marca como ABSENT a los estudiantes que no tienen registro de asistencia
   * Se ejecuta al cerrar la sesión
   */
  private async markAbsentStudents(sessionId: string, groupId: string): Promise<void> {
    try {
      // Obtener todos los estudiantes del grupo
      const enrollments = await this.enrollmentRepository.find({
        where: { groupId },
      });

      const studentIds = enrollments.map((e) => e.studentId);

      if (studentIds.length === 0) {
        this.logger.warn(`No hay estudiantes en el grupo ${groupId}`);
        return;
      }

      // Obtener estudiantes que ya tienen registro de asistencia (PRESENT o LATE)
      const existingRecords = await this.attendanceRecordRepository.find({
        where: {
          sessionId,
          studentId: In(studentIds),
          status: In([AttendanceStatus.PRESENT, AttendanceStatus.LATE]),
        },
      });

      const presentStudentIds = new Set(existingRecords.map((r) => r.studentId));

      // Crear registros de ABSENT para estudiantes sin registro
      const absentStudentIds = studentIds.filter((id) => !presentStudentIds.has(id));

      if (absentStudentIds.length > 0) {
        const absentRecords = absentStudentIds.map((studentId) =>
          this.attendanceRecordRepository.create({
            sessionId,
            studentId,
            status: AttendanceStatus.ABSENT,
            origin: AttendanceOrigin.AI,
            source: AttendanceSource.CAMERA_YOLO,
            confidence: null,
          }),
        );

        await this.attendanceRecordRepository.save(absentRecords);
        this.logger.log(
          `Marcados ${absentRecords.length} estudiantes como ABSENT para sesión ${sessionId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error al marcar estudiantes ausentes para sesión ${sessionId}: ${error.message}`,
      );
      // No lanzar error para no interrumpir el cierre de sesión
    }
  }
}
