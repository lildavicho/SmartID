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
import { Group } from '../../academic/entities/group.entity';

/**
 * Mapeo de clases/grupos internos con clases en plataformas LMS/SIS externas
 * 
 * Compatible con cualquier plataforma que implemente el SISConnector interface.
 * Permite sincronizar asistencia y datos entre SmartPresence y sistemas externos.
 */
@Entity('external_class_mappings')
@Index(['classId', 'platform']) // Índice para búsquedas rápidas
@Index(['platform', 'externalClassId']) // Índice para búsquedas por ID externo
export class ExternalClassMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  classId: string;

  @ManyToOne(() => Group, { nullable: false })
  @JoinColumn({ name: 'classId' })
  class: Group;

  /**
   * Plataforma externa (IDUKAY, MOODLE, GOOGLE_CLASSROOM, CANVAS, etc.)
   * Debe coincidir con un valor de IntegrationProvider enum
   */
  @Column({ length: 50 })
  platform: string;

  /**
   * ID de la clase en la plataforma externa
   */
  @Column({ length: 255 })
  externalClassId: string;

  /**
   * Metadatos adicionales (horarios, configuraciones, etc.)
   */
  @Column({ type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

