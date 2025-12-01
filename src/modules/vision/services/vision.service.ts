import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ClassSession } from '../../session/entities/class-session.entity';
import { AttendanceSnapshot } from '../../session/entities/attendance-snapshot.entity';
import { AttendanceRecord } from '../../session/entities/attendance-record.entity';
import { Student } from '../../academic/entities/student.entity';
import { Enrollment } from '../../academic/entities/enrollment.entity';
import { SessionStatus } from '../../session/enums/session-status.enum';
import { AttendanceStatus } from '../../session/enums/attendance-status.enum';
import { AttendanceOrigin } from '../../session/enums/attendance-origin.enum';
import { AttendanceSource } from '../../session/enums/attendance-source.enum';
import { VisionSnapshotDto } from '../dto/vision-snapshot.dto';
import { VisionHealthResponseDto } from '../dto/vision-health-response.dto';
import { VisionSessionSummaryDto } from '../dto/vision-session-summary.dto';

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private readonly yoloBaseUrl: string;

  constructor(
    @InjectRepository(ClassSession)
    private readonly sessionRepository: Repository<ClassSession>,
    @InjectRepository(AttendanceSnapshot)
    private readonly snapshotRepository: Repository<AttendanceSnapshot>,
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRecordRepository: Repository<AttendanceRecord>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.yoloBaseUrl = this.configService.get<string>('YOLO_BASE_URL') || '';
  }

  /**
   * Verifica el estado del servicio YOLO
   */
  async checkHealth(): Promise<VisionHealthResponseDto> {
    if (!this.yoloBaseUrl) {
      this.logger.warn('YOLO_BASE_URL no configurado');
      return {
        status: 'unavailable',
        model: undefined,
        device: undefined,
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.yoloBaseUrl}/health`, {
          timeout: 5000,
        }),
      );

      return {
        status: response.data?.status || 'ok',
        model: response.data?.model,
        device: response.data?.device,
      };
    } catch (error) {
      this.logger.error(`Error al verificar salud de YOLO: ${error.message}`);
      return {
        status: 'error',
        model: undefined,
        device: undefined,
      };
    }
  }

  /**
   * Procesa un snapshot recibido del servicio YOLO
   */
  async handleSnapshot(dto: VisionSnapshotDto): Promise<void> {
    const { sessionId, deviceId, timestamp, occupancyRate, detectedPersons } = dto;

    this.logger.log(
      `Snapshot recibido para sessionId: ${sessionId}, deviceId: ${deviceId}, personas detectadas: ${detectedPersons.length}`,
    );

    // 1. Validar que la sesión existe y está IN_PROGRESS
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      this.logger.warn(`Snapshot ignorado: sesión ${sessionId} no encontrada`);
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      this.logger.warn(
        `Snapshot ignorado: sesión ${sessionId} no está IN_PROGRESS (status: ${session.status})`,
      );
      throw new BadRequestException(
        `Session ${sessionId} is not IN_PROGRESS. Current status: ${session.status}`,
      );
    }

    // Validar deviceId si se proporciona
    if (deviceId && session.deviceId && session.deviceId !== deviceId) {
      this.logger.warn(
        `DeviceId mismatch: session deviceId=${session.deviceId}, snapshot deviceId=${deviceId}`,
      );
    }

    // 2. Calcular confianza promedio (máximo de las detecciones)
    const maxConfidence =
      detectedPersons.length > 0
        ? Math.max(...detectedPersons.map((p) => p.confidence))
        : 0;

    // 3. Insertar snapshot en attendance_snapshots
    const snapshot = this.snapshotRepository.create({
      sessionId: session.id,
      timestamp: new Date(timestamp),
      detectedPersons: detectedPersons.length,
      occupancyRate,
      confidence: maxConfidence,
      metadata: {
        detectedPersons: detectedPersons.map((p) => ({
          studentId: p.studentId || null,
          confidence: p.confidence,
          bbox: p.bbox || null,
        })),
        deviceId,
      },
    });

    await this.snapshotRepository.save(snapshot);
    this.logger.log(`Snapshot guardado: ${snapshot.id} para sesión ${sessionId}`);

    // 4. Procesar detecciones con studentId válido
    for (const person of detectedPersons) {
      if (person.studentId) {
        await this.updateAttendanceRecord(session.id, person.studentId, person.confidence);
      }
    }
  }

  /**
   * Actualiza o crea un registro de asistencia para un estudiante
   */
  private async updateAttendanceRecord(
    sessionId: string,
    studentId: string,
    confidence: number,
  ): Promise<void> {
    // Buscar registro existente
    let record = await this.attendanceRecordRepository.findOne({
      where: { sessionId, studentId },
    });

    if (!record) {
      // Crear nuevo registro como PRESENT
      record = this.attendanceRecordRepository.create({
        sessionId,
        studentId,
        status: AttendanceStatus.PRESENT,
        origin: AttendanceOrigin.AI,
        source: AttendanceSource.CAMERA_YOLO,
        confidence,
        arrivalTime: new Date(),
      });
    } else {
      // Si ya existe, mantenerlo como PRESENT (no cambiar a ABSENT)
      // Solo actualizar confianza si es mayor
      if (record.confidence === null || confidence > record.confidence) {
        record.confidence = confidence;
      }
      // Si estaba marcado como ABSENT manualmente, no lo cambiamos
      if (record.status === AttendanceStatus.ABSENT && record.manualCorrection) {
        return; // Respetar corrección manual
      }
      // Actualizar a PRESENT si no estaba presente
      if (record.status !== AttendanceStatus.PRESENT) {
        record.status = AttendanceStatus.PRESENT;
        if (!record.arrivalTime) {
          record.arrivalTime = new Date();
        }
      }
    }

    await this.attendanceRecordRepository.save(record);
  }

  /**
   * Obtiene el resumen de asistencia para una sesión
   */
  async getSessionSummary(sessionId: string): Promise<VisionSessionSummaryDto> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['group'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Contar estudiantes totales del grupo
    const totalStudents = await this.enrollmentRepository.count({
      where: { groupId: session.groupId },
    });

    // Contar registros de asistencia
    const attendanceRecords = await this.attendanceRecordRepository.find({
      where: { sessionId },
    });

    const present = attendanceRecords.filter(
      (r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE,
    ).length;

    const absent = totalStudents - present;

    // Obtener último snapshot
    const lastSnapshot = await this.snapshotRepository.findOne({
      where: { sessionId },
      order: { timestamp: 'DESC' },
    });

    // Calcular occupancy rate promedio de los últimos snapshots
    const recentSnapshots = await this.snapshotRepository.find({
      where: { sessionId },
      order: { timestamp: 'DESC' },
      take: 10,
    });

    const avgOccupancyRate =
      recentSnapshots.length > 0
        ? recentSnapshots.reduce((sum, s) => sum + Number(s.occupancyRate), 0) /
          recentSnapshots.length
        : 0;

    return {
      sessionId: session.id,
      status: session.status,
      totalStudents,
      present,
      absent,
      lastSnapshotAt: lastSnapshot?.timestamp?.toISOString() || null,
      occupancyRate: avgOccupancyRate,
    };
  }
}

