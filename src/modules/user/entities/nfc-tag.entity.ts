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
import { User } from './user.entity';

export enum NfcTagStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOST = 'LOST',
  REVOKED = 'REVOKED',
}

@Entity('nfc_tags')
export class NfcTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 100, unique: true })
  uid: string;

  @Column({ length: 255, nullable: true })
  label: string;

  @Column({ type: 'uuid', nullable: true })
  assignedToUserId: string;

  @ManyToOne(() => User, (user) => user.nfcTags, { nullable: true })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedToUser: User;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: NfcTagStatus,
    default: NfcTagStatus.ACTIVE,
  })
  status: NfcTagStatus;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  lastUsedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  institutionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

