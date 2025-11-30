import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TeachingAssignment } from './teaching-assignment.entity';

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

  @OneToMany(() => TeachingAssignment, (assignment) => assignment.teacher)
  teachingAssignments: TeachingAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
