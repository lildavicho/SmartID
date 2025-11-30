import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class SessionFiltersDto {
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
