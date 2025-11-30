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
import { DeviceStatus } from '../enums/device-status.enum';
import { DeviceType } from '../enums/device-type.enum';
import { Classroom } from './classroom.entity';

@Entity('devices')
@Index(['deviceCode'], { unique: true })
@Index(['serialNumber'], { unique: true })
@Index(['campusId', 'status'])
@Index(['institutionId', 'status'])
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  deviceCode: string;

  @Column({ length: 100, unique: true })
  serialNumber: string;

  @Column({ length: 100 })
  model: string;

  @Column({ length: 50, nullable: true })
  firmwareVersion: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: DeviceType,
    default: DeviceType.RIOTOUCH,
  })
  type: DeviceType;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: DeviceStatus,
    default: DeviceStatus.OFFLINE,
  })
  status: DeviceStatus;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  lastSeen: Date;

  @Column({ type: 'uuid', nullable: true })
  institutionId: string;

  @Column({ type: 'uuid', nullable: true })
  campusId: string;

  @Column({ type: 'uuid', nullable: true })
  classroomId: string;

  @ManyToOne(() => Classroom, (classroom) => classroom.devices, { nullable: true })
  @JoinColumn({ name: 'classroomId' })
  classroom: Classroom;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb',
    nullable: true,
  })
  config: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
