import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Device } from './device.entity';
import { User } from '../../user/entities/user.entity';

export enum AttendanceType {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
}

export enum AttendanceMethod {
  NFC = 'NFC',
  FACE = 'FACE',
  MANUAL = 'MANUAL',
  QR = 'QR',
  PIN = 'PIN',
}

@Entity('attendance_logs')
@Index(['userId', 'timestamp'])
@Index(['deviceId', 'timestamp'])
@Index(['timestamp'])
@Index(['institutionId', 'timestamp'])
export class AttendanceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  deviceId: string;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp' })
  timestamp: Date;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: AttendanceType,
  })
  type: AttendanceType;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: AttendanceMethod,
    default: AttendanceMethod.NFC,
  })
  method: AttendanceMethod;

  @Column({ type: 'uuid', nullable: true })
  nfcTagId: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb',
    nullable: true,
  })
  metadata: Record<string, any>;

  @Column({ type: 'uuid' })
  institutionId: string;

  @CreateDateColumn()
  createdAt: Date;
}

