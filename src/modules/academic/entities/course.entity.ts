import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Group } from './group.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  institutionId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 50, nullable: true })
  grade: string;

  @Column({ length: 255, nullable: true })
  external_id: string;

  @OneToMany(() => Group, (group) => group.course)
  groups: Group[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
