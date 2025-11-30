import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsObject,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { AttendanceType, AttendanceMethod } from '../entities/attendance-log.entity';

export class CreateAttendanceLogDto {
  @ApiProperty({
    description: 'UUID of the user checking in/out',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'UUID of the device used for check-in/out',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  deviceId: string;

  @ApiPropertyOptional({
    description: 'Timestamp of the attendance event',
    example: '2024-01-15T08:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiProperty({
    description: 'Type of attendance event',
    enum: AttendanceType,
    example: AttendanceType.CHECK_IN,
  })
  @IsEnum(AttendanceType)
  type: AttendanceType;

  @ApiPropertyOptional({
    description: 'Method used for attendance',
    enum: AttendanceMethod,
    example: AttendanceMethod.NFC,
    default: AttendanceMethod.NFC,
  })
  @IsOptional()
  @IsEnum(AttendanceMethod)
  method?: AttendanceMethod;

  @ApiPropertyOptional({
    description: 'UUID of the NFC tag used',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  nfcTagId?: string;

  @ApiPropertyOptional({
    description: 'Latitude of the check-in location',
    example: 4.710989,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude of the check-in location',
    example: -74.072092,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { verificationScore: 0.95 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'UUID of the institution',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  institutionId: string;
}

