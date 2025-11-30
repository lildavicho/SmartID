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

@Entity('refresh_tokens')
@Index(['token'], { unique: true })
@Index(['userId', 'revoked'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 500, unique: true })
  token: string;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  revokedAt: Date;

  @Column({ length: 45, nullable: true })
  ipAddress: string;

  @Column({ length: 500, nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}

