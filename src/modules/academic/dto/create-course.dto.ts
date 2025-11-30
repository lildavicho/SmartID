import { IsString, IsUUID, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Institution UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  institutionId: string;

  @ApiProperty({
    description: 'Course name',
    example: 'Mathematics I',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Unique course code',
    example: 'MATH101',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({
    description: 'Grade level or year',
    example: '10th Grade',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  grade?: string;

  @ApiPropertyOptional({
    description: 'External system ID (for integrations)',
    example: 'EXT_COURSE_12345',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  external_id?: string;
}
