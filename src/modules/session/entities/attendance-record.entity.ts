import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClassSession } from './class-session.entity';
import { AttendanceStatus } from '../enums/attendance-status.enum';
import { AttendanceOrigin } from '../enums/attendance-origin.enum';

@Entity('attendance_records')
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

  @Column({ type: 'boolean', default: false })
  manualCorrection: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
