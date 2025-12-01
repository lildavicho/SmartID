import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TeachingAssignment } from './teaching-assignment.entity';
import { ExternalTeacherAccount } from '../../integration/entities/external-teacher-account.entity';

@Entity('teachers')
export class Teacher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  institutionId: string;

  @Column({ length: 255 })
  firstName: string;

  @Column({ length: 255 })
  lastName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 50, unique: true })
  employeeCode: string;

  @Column({ length: 255, nullable: true })
  external_id: string;

  /**
   * PIN hash para Quick Login (bcrypt)
   */
  @Column({ name: 'pinHash', type: 'varchar', length: 255, nullable: true })
  pinHash?: string | null;

  /**
   * Intentos fallidos de PIN
   */
  @Column({ name: 'pinFailedAttempts', type: 'int', default: 0 })
  pinFailedAttempts: number;

  /**
   * Fecha hasta la cual la cuenta está bloqueada por intentos fallidos
   */
  @Column({ name: 'pinLockedUntil', type: 'timestamptz', nullable: true })
  pinLockedUntil?: Date | null;

  @OneToMany(() => TeachingAssignment, (assignment) => assignment.teacher)
  teachingAssignments: TeachingAssignment[];

  @OneToMany(() => ExternalTeacherAccount, (account) => account.teacher)
  externalAccounts: ExternalTeacherAccount[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
