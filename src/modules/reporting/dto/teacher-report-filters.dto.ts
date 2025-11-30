import { IsUUID, IsInt, Min, Max, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ExportFormat } from '../enums/export-format.enum';

export class TeacherReportFiltersDto {
  @IsUUID()
  @IsNotEmpty()
  teacherId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  @IsNotEmpty()
  month: number;

  @IsInt()
  @Min(2020)
  @Max(2100)
  @Type(() => Number)
  @IsNotEmpty()
  year: number;

  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat;
}
