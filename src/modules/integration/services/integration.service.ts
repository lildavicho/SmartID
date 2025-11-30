import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration } from '../entities/integration.entity';
import { CreateIntegrationDto } from '../dto/create-integration.dto';
import { UpdateIntegrationDto } from '../dto/update-integration.dto';
import { IntegrationStatus } from '../enums/integration-status.enum';
import { MappingEntityType } from '../enums/mapping-entity-type.enum';
import { ConnectorFactory } from './connector-factory.service';
import { MappingService } from './mapping.service';
import { SyncResult, SendResult } from '../interfaces/sis-connector.interface';

@Injectable()
export class IntegrationService {
  constructor(
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
    private readonly connectorFactory: ConnectorFactory,
    private readonly mappingService: MappingService,
  ) {}

  async createIntegration(createIntegrationDto: CreateIntegrationDto): Promise<Integration> {
    const { institutionId, provider, config, credentials } = createIntegrationDto;

    // Verify provider is supported
    const supportedProviders = this.connectorFactory.getSupportedProviders();
    if (!supportedProviders.includes(provider)) {
      throw new BadRequestException(`Provider ${provider} is not supported`);
    }

    const integration = this.integrationRepository.create({
      institutionId,
      provider,
      config,
      credentials, // In production, encrypt this before saving
      status: IntegrationStatus.INACTIVE,
    });

    return await this.integrationRepository.save(integration);
  }

  async testConnection(integrationId: string): Promise<{ success: boolean; message: string }> {
    const integration = await this.findOne(integrationId);

    try {
      const connector = this.connectorFactory.createConnector(integration.provider);
      await connector.connect(integration.config, integration.credentials);
      const success = await connector.testConnection();
      await connector.disconnect();

      if (success) {
        // Update status to ACTIVE
        integration.status = IntegrationStatus.ACTIVE;
        await this.integrationRepository.save(integration);

        return {
          success: true,
          message: 'Connection successful',
        };
      } else {
        integration.status = IntegrationStatus.ERROR;
        await this.integrationRepository.save(integration);

        return {
          success: false,
          message: 'Connection failed',
        };
      }
    } catch (error) {
      integration.status = IntegrationStatus.ERROR;
      await this.integrationRepository.save(integration);

      return {
        success: false,
        message: error.message || 'Connection test failed',
      };
    }
  }

  async syncData(integrationId: string, entityType?: MappingEntityType): Promise<SyncResult> {
    const integration = await this.findOne(integrationId);

    if (integration.status !== IntegrationStatus.ACTIVE) {
      throw new BadRequestException('Integration is not active. Please test connection first.');
    }

    try {
      const connector = this.connectorFactory.createConnector(integration.provider);
      await connector.connect(integration.config, integration.credentials);

      let result: SyncResult;

      // Sync based on entity type
      if (!entityType || entityType === MappingEntityType.STUDENT) {
        result = await connector.syncStudents(integration.institutionId);
      } else if (entityType === MappingEntityType.COURSE) {
        result = await connector.syncCourses(integration.institutionId);
      } else {
        throw new BadRequestException(`Sync not supported for entity type: ${entityType}`);
      }

      await connector.disconnect();

      // Update last sync time
      integration.lastSyncAt = new Date();
      await this.integrationRepository.save(integration);

      return result;
    } catch (error) {
      integration.status = IntegrationStatus.ERROR;
      await this.integrationRepository.save(integration);

      throw new BadRequestException(`Sync failed: ${error.message}`);
    }
  }

  async sendAttendance(integrationId: string, sessionId: string): Promise<SendResult> {
    const integration = await this.findOne(integrationId);

    if (integration.status !== IntegrationStatus.ACTIVE) {
      throw new BadRequestException('Integration is not active');
    }

    try {
      const connector = this.connectorFactory.createConnector(integration.provider);
      await connector.connect(integration.config, integration.credentials);

      const result = await connector.sendAttendance(sessionId);

      await connector.disconnect();

      return result;
    } catch (error) {
      throw new BadRequestException(`Send attendance failed: ${error.message}`);
    }
  }

  async findAll(institutionId?: string): Promise<Integration[]> {
    const where: { institutionId?: string } = {};

    if (institutionId) {
      where.institutionId = institutionId;
    }

    return await this.integrationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Integration> {
    const integration = await this.integrationRepository.findOne({
      where: { id },
      relations: ['mappings'],
    });

    if (!integration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    return integration;
  }

  async update(id: string, updateIntegrationDto: UpdateIntegrationDto): Promise<Integration> {
    const integration = await this.findOne(id);

    Object.assign(integration, updateIntegrationDto);

    // Reset status if config or credentials changed
    if (updateIntegrationDto.config || updateIntegrationDto.credentials) {
      integration.status = IntegrationStatus.INACTIVE;
    }

    return await this.integrationRepository.save(integration);
  }

  async remove(id: string): Promise<void> {
    const integration = await this.findOne(id);

    // Delete all mappings first
    await this.mappingService.deleteMappingsByIntegration(id);

    await this.integrationRepository.remove(integration);
  }

  async getSyncLogs(integrationId: string): Promise<any> {
    const integration = await this.findOne(integrationId);

    // In a real implementation, you would have a separate SyncLog entity
    // For now, return basic info
    return {
      integrationId: integration.id,
      provider: integration.provider,
      status: integration.status,
      lastSyncAt: integration.lastSyncAt,
      mappingsCount: integration.mappings?.length || 0,
    };
  }
}
