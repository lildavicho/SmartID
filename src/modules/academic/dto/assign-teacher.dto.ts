import { IsUUID, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AssignTeacherDto {
  @IsUUID()
  @IsNotEmpty()
  teacherId: string;

  @IsUUID()
  @IsNotEmpty()
  groupId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  academicTerm: string;
}
