import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { Role } from './role.entity';
import { NfcTag } from './nfc-tag.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { UserSession } from '../../auth/entities/user-session.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['institutionId', 'status'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  institutionId: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  password: string; // Hashed password

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'uuid', nullable: true })
  roleId: string;

  @ManyToOne(() => Role, (role) => role.users, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: UserRole,
    default: UserRole.TEACHER,
  })
  legacyRole: UserRole;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  lastLoginAt: Date;

  @Column({ length: 255, nullable: true })
  avatarUrl: string;

  @OneToMany(() => NfcTag, (nfcTag) => nfcTag.assignedToUser)
  nfcTags: NfcTag[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
