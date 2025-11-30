import { IsString, IsUUID, IsNotEmpty, IsEmail, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeacherDto {
  @ApiProperty({
    description: 'Institution UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  institutionId: string;

  @ApiProperty({
    description: 'Teacher first name',
    example: 'Maria',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  firstName: string;

  @ApiProperty({
    description: 'Teacher last name',
    example: 'Garcia',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  lastName: string;

  @ApiProperty({
    description: 'Teacher email address',
    example: 'maria.garcia@university.edu',
    maxLength: 255,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Unique employee code',
    example: 'TEACH2024001',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeCode: string;

  @ApiPropertyOptional({
    description: 'External system ID (for integrations)',
    example: 'EXT_TEACH_12345',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  external_id?: string;
}
