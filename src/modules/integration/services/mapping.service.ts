import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationMapping } from '../entities/integration-mapping.entity';
import { MappingEntityType } from '../enums/mapping-entity-type.enum';

@Injectable()
export class MappingService {
  constructor(
    @InjectRepository(IntegrationMapping)
    private readonly mappingRepository: Repository<IntegrationMapping>,
  ) {}

  async createMapping(
    integrationId: string,
    entityType: MappingEntityType,
    internalId: string,
    externalId: string,
    metadata?: Record<string, any>,
  ): Promise<IntegrationMapping> {
    // Check if mapping already exists
    const existing = await this.mappingRepository.findOne({
      where: { integrationId, entityType, internalId },
    });

    if (existing) {
      // Update existing mapping
      existing.externalId = externalId;
      if (metadata) {
        existing.metadata = metadata;
      }
      return await this.mappingRepository.save(existing);
    }

    // Create new mapping
    const mapping = this.mappingRepository.create({
      integrationId,
      entityType,
      internalId,
      externalId,
      metadata,
    });

    return await this.mappingRepository.save(mapping);
  }

  async getMapping(
    integrationId: string,
    entityType: MappingEntityType,
    internalId: string,
  ): Promise<IntegrationMapping | null> {
    return await this.mappingRepository.findOne({
      where: { integrationId, entityType, internalId },
    });
  }

  async findByExternalId(
    integrationId: string,
    entityType: MappingEntityType,
    externalId: string,
  ): Promise<IntegrationMapping | null> {
    return await this.mappingRepository.findOne({
      where: { integrationId, entityType, externalId },
    });
  }

  async getMappingsByIntegration(
    integrationId: string,
    entityType?: MappingEntityType,
  ): Promise<IntegrationMapping[]> {
    const where: any = { integrationId };

    if (entityType) {
      where.entityType = entityType;
    }

    return await this.mappingRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async deleteMapping(id: string): Promise<void> {
    const mapping = await this.mappingRepository.findOne({
      where: { id },
    });

    if (!mapping) {
      throw new NotFoundException(`Mapping with ID ${id} not found`);
    }

    await this.mappingRepository.remove(mapping);
  }

  async deleteMappingsByIntegration(integrationId: string): Promise<void> {
    await this.mappingRepository.delete({ integrationId });
  }
}
