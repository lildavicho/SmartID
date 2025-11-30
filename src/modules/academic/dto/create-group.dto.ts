import { IsString, IsUUID, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateGroupDto {
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  academicTerm: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  external_id?: string;
}
