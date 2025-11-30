import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { IntegrationProvider } from '../enums/integration-provider.enum';
import { IntegrationStatus } from '../enums/integration-status.enum';
import { IntegrationMapping } from './integration-mapping.entity';

@Entity('integrations')
export class Integration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  institutionId: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: IntegrationProvider,
  })
  provider: IntegrationProvider;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb' })
  config: Record<string, any>;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb' })
  credentials: Record<string, any>; // Should be encrypted in production

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'text' : 'enum',
    enum: IntegrationStatus,
    default: IntegrationStatus.INACTIVE,
  })
  status: IntegrationStatus;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  lastSyncAt: Date;

  @OneToMany(() => IntegrationMapping, (mapping) => mapping.integration)
  mappings: IntegrationMapping[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
