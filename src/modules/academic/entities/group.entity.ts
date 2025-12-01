import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Course } from './course.entity';
import { Enrollment } from './enrollment.entity';
import { TeachingAssignment } from './teaching-assignment.entity';
import { ExternalClassMapping } from '../../integration/entities/external-class-mapping.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, (course) => course.groups)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100 })
  academicTerm: string;

  @Column({ length: 255, nullable: true })
  external_id: string;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.group)
  enrollments: Enrollment[];

  @OneToMany(() => TeachingAssignment, (assignment) => assignment.group)
  teachingAssignments: TeachingAssignment[];

  @OneToMany(() => ExternalClassMapping, (mapping) => mapping.class)
  externalMappings: ExternalClassMapping[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
