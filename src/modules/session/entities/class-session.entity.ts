import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SessionStatus } from '../enums/session-status.enum';
import { AttendanceSnapshot } from './attendance-snapshot.entity';
import { AttendanceRecord } from './attendance-record.entity';

@Entity('class_sessions')
export class ClassSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  groupId: string;

  @Column({ type: 'uuid' })
  teacherId: string;

  @Column({ type: 'uuid' })
  classroomId: string;

  @Column({ type: 'uuid', nullable: true })
  deviceId: string;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp' })
  scheduledStart: Date;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp' })
  scheduledEnd: Date;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  actualStart: Date;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  actualEnd: Date;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED,
  })
  status: SessionStatus;

  @OneToMany(() => AttendanceSnapshot, (snapshot) => snapshot.session)
  snapshots: AttendanceSnapshot[];

  @OneToMany(() => AttendanceRecord, (record) => record.session)
  attendanceRecords: AttendanceRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
