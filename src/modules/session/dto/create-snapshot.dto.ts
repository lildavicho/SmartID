import {
  IsUUID,
  IsNotEmpty,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateSnapshotDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  detectedPersons: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  occupancyRate: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  confidence: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
