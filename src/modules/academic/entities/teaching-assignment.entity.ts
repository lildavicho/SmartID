import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Teacher } from './teacher.entity';
import { Group } from './group.entity';

@Entity('teaching_assignments')
export class TeachingAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  teacherId: string;

  @ManyToOne(() => Teacher, (teacher) => teacher.teachingAssignments)
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column({ type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, (group) => group.teachingAssignments)
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column({ length: 100 })
  academicTerm: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
