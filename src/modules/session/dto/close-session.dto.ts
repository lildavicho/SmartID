import { IsUUID, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceCorrection } from './attendance-correction.dto';

export class CloseSessionDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttendanceCorrection)
  manualCorrections?: AttendanceCorrection[];
}
