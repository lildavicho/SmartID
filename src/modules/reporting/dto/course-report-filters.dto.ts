import { IsUUID, IsDateString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ExportFormat } from '../enums/export-format.enum';

export class CourseReportFiltersDto {
  @IsUUID()
  @IsNotEmpty()
  groupId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat;
}
