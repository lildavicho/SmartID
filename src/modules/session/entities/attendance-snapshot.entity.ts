import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClassSession } from './class-session.entity';

@Entity('attendance_snapshots')
export class AttendanceSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => ClassSession, (session) => session.snapshots)
  @JoinColumn({ name: 'sessionId' })
  session: ClassSession;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp' })
  timestamp: Date;

  @Column({ type: 'int' })
  detectedPersons: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  occupancyRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  confidence: number;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb',
    nullable: true,
  })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
