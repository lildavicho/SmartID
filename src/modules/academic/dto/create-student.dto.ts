import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({
    description: 'Institution UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  institutionId: string;

  @ApiProperty({
    description: 'Student first name',
    example: 'John',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  firstName: string;

  @ApiProperty({
    description: 'Student last name',
    example: 'Doe',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  lastName: string;

  @ApiProperty({
    description: 'Student email address',
    example: 'john.doe@university.edu',
    maxLength: 255,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Unique student code/ID',
    example: 'STU2024001',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  studentCode: string;

  @ApiProperty({
    description: 'Student enrollment date (ISO 8601 format)',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  enrollmentDate: string;

  @ApiPropertyOptional({
    description: 'External system ID (for integrations)',
    example: 'EXT_STU_12345',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  external_id?: string;
}
