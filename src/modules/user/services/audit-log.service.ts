import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';

export interface AuditLogQuery {
  institutionId?: string;
  actorUserId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(createAuditLogDto);
    return this.auditLogRepository.save(auditLog);
  }

  async log(
    action: AuditAction,
    options: {
      actorUserId?: string;
      entityType?: string;
      entityId?: string;
      description?: string;
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      institutionId?: string;
    },
  ): Promise<AuditLog> {
    return this.create({
      action,
      ...options,
    });
  }

  async findAll(query: AuditLogQuery): Promise<PaginatedAuditLogs> {
    const {
      institutionId,
      actorUserId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = query;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.actorUser', 'actorUser')
      .orderBy('auditLog.createdAt', 'DESC');

    if (institutionId) {
      queryBuilder.andWhere('auditLog.institutionId = :institutionId', { institutionId });
    }

    if (actorUserId) {
      queryBuilder.andWhere('auditLog.actorUserId = :actorUserId', { actorUserId });
    }

    if (action) {
      queryBuilder.andWhere('auditLog.action = :action', { action });
    }

    if (entityType) {
      queryBuilder.andWhere('auditLog.entityType = :entityType', { entityType });
    }

    if (entityId) {
      queryBuilder.andWhere('auditLog.entityId = :entityId', { entityId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('auditLog.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('auditLog.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('auditLog.createdAt <= :endDate', { endDate });
    }

    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / limit);

    queryBuilder.skip((page - 1) * limit).take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      relations: ['actorUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(actorUserId: string, limit = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { actorUserId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRecentActivity(institutionId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { institutionId },
      relations: ['actorUser'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

