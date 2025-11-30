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
import { Integration } from './integration.entity';
import { MappingEntityType } from '../enums/mapping-entity-type.enum';

@Entity('integration_mappings')
@Index(['integrationId', 'entityType', 'internalId'], { unique: true })
@Index(['integrationId', 'entityType', 'externalId'], { unique: true })
export class IntegrationMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  integrationId: string;

  @ManyToOne(() => Integration, (integration) => integration.mappings)
  @JoinColumn({ name: 'integrationId' })
  integration: Integration;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: MappingEntityType,
  })
  entityType: MappingEntityType;

  @Column({ type: 'uuid' })
  internalId: string;

  @Column({ length: 255 })
  externalId: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb',
    nullable: true,
  })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
