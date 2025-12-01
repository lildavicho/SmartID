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
import { Teacher } from '../../academic/entities/teacher.entity';

/**
 * Cuentas externas de profesores en plataformas LMS/SIS
 * 
 * Compatible con cualquier plataforma que implemente el SISConnector interface:
 * - IDUKAY, Moodle, Google Classroom, Canvas, Blackboard, Schoology, Brightspace, Sakai, etc.
 * 
 * Permite mapear un profesor interno con su cuenta en sistemas externos,
 * facilitando la sincronización bidireccional de datos.
 */
@Entity('external_teacher_accounts')
@Index(['teacherId', 'platform']) // Índice para búsquedas rápidas
@Index(['platform', 'externalId']) // Índice para búsquedas por ID externo
export class ExternalTeacherAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  teacherId: string;

  @ManyToOne(() => Teacher, { nullable: false })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  /**
   * Plataforma externa (IDUKAY, MOODLE, GOOGLE_CLASSROOM, CANVAS, etc.)
   * Debe coincidir con un valor de IntegrationProvider enum
   */
  @Column({ length: 50 })
  platform: string;

  /**
   * ID del profesor en la plataforma externa
   */
  @Column({ length: 255 })
  externalId: string;

  /**
   * Metadatos adicionales (tokens, refresh tokens, etc.)
   */
  @Column({ type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

