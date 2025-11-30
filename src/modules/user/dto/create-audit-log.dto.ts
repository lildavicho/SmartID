import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsObject,
  MaxLength,
} from 'class-validator';
import { AuditAction } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @ApiPropertyOptional({
    description: 'UUID of the user performing the action',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @ApiProperty({
    description: 'The action performed',
    enum: AuditAction,
    example: AuditAction.LOGIN,
  })
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiPropertyOptional({
    description: 'Type of entity affected',
    example: 'User',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  @ApiPropertyOptional({
    description: 'UUID of the entity affected',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Description of the action',
    example: 'User logged in successfully',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { browser: 'Chrome', os: 'Windows' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'IP address of the request',
    example: '192.168.1.1',
    maxLength: 45,
  })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent of the request',
    example: 'Mozilla/5.0...',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Institution ID for the audit log',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  institutionId?: string;
}

