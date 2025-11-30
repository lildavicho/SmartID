import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS = 'ACCESS',
  EXPORT = 'EXPORT',
  SYNC = 'SYNC',
  ATTENDANCE_CHECK_IN = 'ATTENDANCE_CHECK_IN',
  ATTENDANCE_CHECK_OUT = 'ATTENDANCE_CHECK_OUT',
  NFC_SCAN = 'NFC_SCAN',
  DEVICE_REGISTERED = 'DEVICE_REGISTERED',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
}

@Entity('audit_logs')
@Index(['actorUserId', 'createdAt'])
@Index(['entityType', 'entityId'])
@Index(['action', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  actorUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actorUserId' })
  actorUser: User;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ length: 100, nullable: true })
  entityType: string;

  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb',
    nullable: true,
  })
  metadata: Record<string, any>;

  @Column({ length: 45, nullable: true })
  ipAddress: string;

  @Column({ length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'uuid', nullable: true })
  institutionId: string;

  @CreateDateColumn()
  createdAt: Date;
}

