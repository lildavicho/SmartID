import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ClassSession } from './class-session.entity';
import { AttendanceStatus } from '../enums/attendance-status.enum';
import { AttendanceOrigin } from '../enums/attendance-origin.enum';
import { AttendanceSource } from '../enums/attendance-source.enum';

@Entity('attendance_records')
@Index(['sessionId', 'studentId']) // Índice compuesto para búsquedas rápidas
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => ClassSession, (session) => session.attendanceRecords)
  @JoinColumn({ name: 'sessionId' })
  session: ClassSession;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT,
  })
  status: AttendanceStatus;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  arrivalTime: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  permanencePercentage: number;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: AttendanceOrigin,
    default: AttendanceOrigin.AI,
  })
  origin: AttendanceOrigin;

  /**
   * Fuente del registro de asistencia
   * - NFC: Registro mediante tarjeta NFC
   * - CAMERA_YOLO: Detección automática mediante cámara y modelo YOLO/RKNN
   * - MANUAL: Registro manual por el profesor
   */
  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: AttendanceSource,
    default: AttendanceSource.MANUAL,
  })
  source: AttendanceSource;

  /**
   * Nivel de confianza para detecciones de cámara (0-1)
   * Solo aplicable cuando source = CAMERA_YOLO
   */
  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidence: number | null;

  @Column({ type: 'boolean', default: false })
  manualCorrection: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
