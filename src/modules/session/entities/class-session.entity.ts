import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SessionStatus } from '../enums/session-status.enum';
import { AttendanceSnapshot } from './attendance-snapshot.entity';
import { AttendanceRecord } from './attendance-record.entity';
import { Group } from '../../academic/entities/group.entity';
import { Teacher } from '../../academic/entities/teacher.entity';
import { Classroom } from '../../device/entities/classroom.entity';

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

  // Relations
  @ManyToOne(() => Group, { nullable: false })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @ManyToOne(() => Teacher, { nullable: false })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @ManyToOne(() => Classroom, { nullable: false })
  @JoinColumn({ name: 'classroomId' })
  classroom: Classroom;

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
    default: SessionStatus.PENDING,
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
