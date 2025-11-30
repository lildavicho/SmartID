import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCampusDto {
  @ApiProperty({
    description: 'Institution ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  institutionId: string;

  @ApiProperty({
    description: 'Campus name',
    example: 'Campus Central',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Campus address',
    example: 'Av. Principal 123',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'City where the campus is located',
    example: 'Bogotá',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;
}
