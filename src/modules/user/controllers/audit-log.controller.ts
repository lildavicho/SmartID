import {
  Controller,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogService, PaginatedAuditLogs } from '../services/audit-log.service';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';

@ApiTags('audit-logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs with filters' })
  @ApiQuery({ name: 'institutionId', required: false, type: 'string' })
  @ApiQuery({ name: 'actorUserId', required: false, type: 'string' })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'entityType', required: false, type: 'string' })
  @ApiQuery({ name: 'entityId', required: false, type: 'string' })
  @ApiQuery({ name: 'startDate', required: false, type: 'string' })
  @ApiQuery({ name: 'endDate', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 50 })
  @ApiResponse({ status: 200, description: 'Paginated list of audit logs' })
  async findAll(
    @Query('institutionId') institutionId?: string,
    @Query('actorUserId') actorUserId?: string,
    @Query('action') action?: AuditAction,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedAuditLogs> {
    return this.auditLogService.findAll({
      institutionId,
      actorUserId,
      action,
      entityType,
      entityId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page || 1,
      limit: limit || 50,
    });
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get audit logs for a specific entity' })
  @ApiParam({ name: 'entityType', type: 'string' })
  @ApiParam({ name: 'entityId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of audit logs for entity', type: [AuditLog] })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogService.findByEntity(entityType, entityId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 100 })
  @ApiResponse({ status: 200, description: 'List of audit logs for user', type: [AuditLog] })
  async findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: number,
  ): Promise<AuditLog[]> {
    return this.auditLogService.findByUser(userId, limit || 100);
  }

  @Get('recent/:institutionId')
  @ApiOperation({ summary: 'Get recent activity for an institution' })
  @ApiParam({ name: 'institutionId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 50 })
  @ApiResponse({ status: 200, description: 'List of recent audit logs', type: [AuditLog] })
  async getRecentActivity(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Query('limit') limit?: number,
  ): Promise<AuditLog[]> {
    return this.auditLogService.getRecentActivity(institutionId, limit || 50);
  }
}

