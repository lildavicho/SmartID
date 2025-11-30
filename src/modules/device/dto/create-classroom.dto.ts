import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassroomDto {
  @ApiProperty({
    description: 'Campus ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  campusId: string;

  @ApiProperty({
    description: 'Classroom name',
    example: 'Aula 101',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Building name or number',
    example: 'Edificio A',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  building?: string;

  @ApiPropertyOptional({
    description: 'Floor number or name',
    example: '1',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  floor?: string;

  @ApiPropertyOptional({
    description: 'Classroom capacity (number of seats)',
    example: 40,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  capacity?: number;
}
