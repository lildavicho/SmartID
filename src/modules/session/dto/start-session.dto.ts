import { IsUUID, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class StartSessionDto {
  @IsUUID()
  @IsNotEmpty()
  groupId: string;

  @IsUUID()
  @IsNotEmpty()
  teacherId: string;

  @IsUUID()
  @IsNotEmpty()
  classroomId: string;

  @IsUUID()
  @IsOptional()
  deviceId?: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledStart: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledEnd: string;
}
