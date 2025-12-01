import { IsUUID, IsNumber, IsArray, IsOptional, IsDateString, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DetectedPersonDto {
  @ApiPropertyOptional({ description: 'Student UUID if identified, null otherwise' })
  @IsOptional()
  @IsUUID()
  studentId?: string | null;

  @ApiProperty({ description: 'Confidence score (0-1)', example: 0.93 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiPropertyOptional({ description: 'Bounding box [x, y, width, height]', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  bbox?: number[];
}

export class VisionSnapshotDto {
  @ApiProperty({ description: 'Class session UUID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Device UUID' })
  @IsUUID()
  deviceId: string;

  @ApiProperty({ description: 'ISO8601 timestamp', example: '2025-01-15T10:30:00Z' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ description: 'Occupancy rate (0-1)', example: 0.75 })
  @IsNumber()
  @Min(0)
  @Max(1)
  occupancyRate: number;

  @ApiProperty({ description: 'List of detected persons', type: [DetectedPersonDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetectedPersonDto)
  detectedPersons: DetectedPersonDto[];
}

