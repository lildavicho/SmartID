import { IsUUID, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { AttendanceStatus } from '../enums/attendance-status.enum';

export class UpdateAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status: AttendanceStatus;

  @IsDateString()
  @IsOptional()
  arrivalTime?: string;
}
