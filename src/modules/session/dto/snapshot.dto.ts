import { IsUUID, IsNumber, IsArray, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendSnapshotDto {
  @ApiProperty({ description: 'ID de la sesión activa' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Número de personas detectadas' })
  @IsNumber()
  @Min(0)
  detectedPersons: number;

  @ApiProperty({ description: 'Confianza de la detección (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({ description: 'IDs de estudiantes detectados (opcional)', required: false })
  @IsOptional()
  @IsArray()
  detectedStudentIds?: string[];
}

