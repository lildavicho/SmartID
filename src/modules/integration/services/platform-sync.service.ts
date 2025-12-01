import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExternalTeacherAccount } from '../entities/external-teacher-account.entity';
import { ExternalClassMapping } from '../entities/external-class-mapping.entity';
import { Teacher } from '../../academic/entities/teacher.entity';
import { Group } from '../../academic/entities/group.entity';
import { Student } from '../../academic/entities/student.entity';
import { ClassSession } from '../../session/entities/class-session.entity';
import { Integration } from '../entities/integration.entity';
import { IntegrationService } from './integration.service';
import { MappingService } from './mapping.service';
import { MappingEntityType } from '../enums/mapping-entity-type.enum';
import { IntegrationProvider } from '../enums/integration-provider.enum';
import { IntegrationStatus } from '../enums/integration-status.enum';

/**
 * Servicio genérico de sincronización con plataformas LMS/SIS externas
 * 
 * Este servicio es compatible con cualquier plataforma que implemente el SISConnector interface:
 * - IDUKAY
 * - Moodle
 * - Google Classroom
 * - Canvas
 * - Blackboard
 * - Cualquier otro sistema que implemente el contrato
 * 
 * Utiliza el sistema de conectores existente para abstraer las diferencias entre plataformas.
 */
@Injectable()
export class PlatformSyncService {
  private readonly logger = new Logger(PlatformSyncService.name);

  constructor(
    @InjectRepository(ExternalTeacherAccount)
    private readonly externalTeacherAccountRepository: Repository<ExternalTeacherAccount>,
    @InjectRepository(ExternalClassMapping)
    private readonly externalClassMappingRepository: Repository<ExternalClassMapping>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(ClassSession)
    private readonly sessionRepository: Repository<ClassSession>,
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
    private readonly integrationService: IntegrationService,
    private readonly mappingService: MappingService,
  ) {}

  /**
   * Sincroniza profesores desde cualquier plataforma externa
   * 
   * @param integrationId ID de la integración configurada
   * @param institutionId ID de la institución (opcional, se obtiene de la integración)
   */
  async syncTeachers(integrationId: string, institutionId?: string): Promise<void> {
    this.logger.log(
      `[PlatformSync] syncTeachers llamado para integrationId: ${integrationId}${institutionId ? `, institutionId: ${institutionId}` : ''}`,
    );

    const integration = await this.integrationRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException(`Integración con ID ${integrationId} no encontrada`);
    }

    const finalInstitutionId = institutionId || integration.institutionId;

    try {
      // Usar el sistema de integración genérico
      const syncResult = await this.integrationService.syncData(
        integrationId,
        MappingEntityType.TEACHER,
      );

      if (syncResult.success) {
        this.logger.log(
          `[PlatformSync] ${syncResult.synced} profesores sincronizados desde ${integration.provider}`,
        );

        // Actualizar mapeos en external_teacher_accounts
        for (const mapping of syncResult.mappings) {
          await this.updateExternalTeacherAccount(
            mapping.internalId,
            integration.provider,
            mapping.externalId,
            mapping.metadata,
          );
        }
      } else {
        this.logger.error(
          `[PlatformSync] Error al sincronizar profesores: ${syncResult.errors.join(', ')}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[PlatformSync] Error al sincronizar profesores desde ${integration.provider}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Sincroniza estudiantes desde cualquier plataforma externa
   */
  async syncStudents(integrationId: string, institutionId?: string): Promise<void> {
    this.logger.log(
      `[PlatformSync] syncStudents llamado para integrationId: ${integrationId}${institutionId ? `, institutionId: ${institutionId}` : ''}`,
    );

    const integration = await this.integrationRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException(`Integración con ID ${integrationId} no encontrada`);
    }

    try {
      const syncResult = await this.integrationService.syncData(
        integrationId,
        MappingEntityType.STUDENT,
      );

      if (syncResult.success) {
        this.logger.log(
          `[PlatformSync] ${syncResult.synced} estudiantes sincronizados desde ${integration.provider}`,
        );
      } else {
        this.logger.error(
          `[PlatformSync] Error al sincronizar estudiantes: ${syncResult.errors.join(', ')}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[PlatformSync] Error al sincronizar estudiantes desde ${integration.provider}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Sincroniza clases/grupos desde cualquier plataforma externa
   */
  async syncClasses(integrationId: string, institutionId?: string): Promise<void> {
    this.logger.log(
      `[PlatformSync] syncClasses llamado para integrationId: ${integrationId}${institutionId ? `, institutionId: ${institutionId}` : ''}`,
    );

    const integration = await this.integrationRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException(`Integración con ID ${integrationId} no encontrada`);
    }

    try {
      const syncResult = await this.integrationService.syncData(
        integrationId,
        MappingEntityType.GROUP,
      );

      if (syncResult.success) {
        this.logger.log(
          `[PlatformSync] ${syncResult.synced} clases sincronizadas desde ${integration.provider}`,
        );

        // Actualizar mapeos en external_class_mappings
        for (const mapping of syncResult.mappings) {
          await this.updateExternalClassMapping(
            mapping.internalId,
            integration.provider,
            mapping.externalId,
            mapping.metadata,
          );
        }
      } else {
        this.logger.error(
          `[PlatformSync] Error al sincronizar clases: ${syncResult.errors.join(', ')}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[PlatformSync] Error al sincronizar clases desde ${integration.provider}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Envía asistencia de una sesión a cualquier plataforma externa
   */
  async pushAttendanceForSession(
    integrationId: string,
    sessionId: string,
  ): Promise<void> {
    this.logger.log(
      `[PlatformSync] pushAttendanceForSession llamado para integrationId: ${integrationId}, sessionId: ${sessionId}`,
    );

    const integration = await this.integrationRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException(`Integración con ID ${integrationId} no encontrada`);
    }

    try {
      const sendResult = await this.integrationService.sendAttendance(integrationId, sessionId);

      if (sendResult.success) {
        this.logger.log(
          `[PlatformSync] Asistencia enviada exitosamente a ${integration.provider}. ${sendResult.sent} registros enviados.`,
        );
      } else {
        this.logger.error(
          `[PlatformSync] Error al enviar asistencia: ${sendResult.errors.join(', ')}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[PlatformSync] Error al enviar asistencia a ${integration.provider}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Actualiza o crea un mapeo de cuenta externa de profesor
   */
  private async updateExternalTeacherAccount(
    teacherId: string,
    platform: string,
    externalId: string,
    metadata?: Record<string, any>,
  ): Promise<ExternalTeacherAccount> {
    let account = await this.externalTeacherAccountRepository.findOne({
      where: { teacherId, platform },
    });

    if (account) {
      account.externalId = externalId;
      account.metadata = metadata || account.metadata;
    } else {
      account = this.externalTeacherAccountRepository.create({
        teacherId,
        platform,
        externalId,
        metadata,
      });
    }

    return await this.externalTeacherAccountRepository.save(account);
  }

  /**
   * Actualiza o crea un mapeo de clase externa
   */
  private async updateExternalClassMapping(
    classId: string,
    platform: string,
    externalClassId: string,
    metadata?: Record<string, any>,
  ): Promise<ExternalClassMapping> {
    let mapping = await this.externalClassMappingRepository.findOne({
      where: { classId, platform },
    });

    if (mapping) {
      mapping.externalClassId = externalClassId;
      mapping.metadata = metadata || mapping.metadata;
    } else {
      mapping = this.externalClassMappingRepository.create({
        classId,
        platform,
        externalClassId,
        metadata,
      });
    }

    return await this.externalClassMappingRepository.save(mapping);
  }

  /**
   * Obtiene todas las integraciones activas para una institución
   */
  async getActiveIntegrations(institutionId: string): Promise<Integration[]> {
    return await this.integrationRepository.find({
      where: { institutionId, status: IntegrationStatus.ACTIVE },
    });
  }

  /**
   * Sincroniza todos los datos (profesores, estudiantes, clases) desde una plataforma
   */
  async syncAll(integrationId: string, institutionId?: string): Promise<void> {
    this.logger.log(`[PlatformSync] syncAll iniciado para integrationId: ${integrationId}`);

    await this.syncTeachers(integrationId, institutionId);
    await this.syncStudents(integrationId, institutionId);
    await this.syncClasses(integrationId, institutionId);

    this.logger.log(`[PlatformSync] syncAll completado para integrationId: ${integrationId}`);
  }
}

