import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateSessionDto {
  @IsDateString()
  startTime: Date;

  @IsDateString()
  @IsOptional()
  endTime?: Date;

  @IsString()
  @MaxLength(50)
  status: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
