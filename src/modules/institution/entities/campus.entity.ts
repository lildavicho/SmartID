import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Institution } from './institution.entity';

@Entity('campuses')
export class Campus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  institutionId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Institution, (institution) => institution.campuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
