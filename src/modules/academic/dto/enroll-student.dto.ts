import { IsUUID, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class EnrollStudentDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsNotEmpty()
  groupId: string;

  @IsDateString()
  @IsOptional()
  enrollmentDate?: string;
}
