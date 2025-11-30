import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  Matches,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInstitutionDto {
  @ApiProperty({
    description: 'Institution name',
    example: 'Universidad Nacional',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Unique institution code (format: INST001)',
    example: 'INST001',
    maxLength: 100,
    pattern: '^INST[0-9]{3,}$',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^INST[0-9]{3,}$/, {
    message: 'Code must follow the format INST001, INST002, etc.',
  })
  code: string;

  @ApiProperty({
    description: 'Country where the institution is located',
    example: 'Colombia',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiPropertyOptional({
    description: 'Timezone for the institution',
    example: 'America/Bogota',
    default: 'UTC',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Additional configuration in JSON format',
    example: { academicYear: 2024, maxStudents: 5000 },
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Whether the institution is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
