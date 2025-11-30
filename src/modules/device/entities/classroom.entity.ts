import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Device } from './device.entity';

@Entity('classrooms')
export class Classroom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campusId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, nullable: true })
  building: string;

  @Column({ length: 50, nullable: true })
  floor: string;

  @Column({ type: 'int', nullable: true })
  capacity: number;

  @OneToMany(() => Device, (device) => device.classroom)
  devices: Device[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
