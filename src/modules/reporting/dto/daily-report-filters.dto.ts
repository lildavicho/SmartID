import { IsUUID, IsDateString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ExportFormat } from '../enums/export-format.enum';

export class DailyReportFiltersDto {
  @IsUUID()
  @IsNotEmpty()
  institutionId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat;
}
