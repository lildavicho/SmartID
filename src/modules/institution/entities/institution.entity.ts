import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Campus } from './campus.entity';

@Entity('institutions')
export class Institution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  code: string;

  @Column({ length: 255, nullable: true })
  externalId: string; // ID externo (ej. idukay_school_id)

  @Column({ length: 100 })
  country: string;

  @Column({ length: 100, default: 'UTC' })
  timezone: string;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Campus, (campus) => campus.institution, {
    cascade: true,
  })
  campuses: Campus[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
