import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('user_sessions')
@Index(['token'], { unique: true })
@Index(['userId', 'isActive'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 500, unique: true })
  token: string;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp' })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 45, nullable: true })
  ipAddress: string;

  @Column({ length: 500, nullable: true })
  userAgent: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  lastActivityAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

