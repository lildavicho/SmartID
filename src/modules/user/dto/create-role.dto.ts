import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Unique name of the role',
    example: 'admin',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the role',
    example: 'Administrator with full access',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    description: 'JSON object containing role permissions',
    example: {
      canManageUsers: true,
      canManageDevices: true,
      canViewReports: true,
      allowedModules: ['users', 'devices', 'reports'],
    },
  })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean | string[]>;

  @ApiPropertyOptional({
    description: 'Whether the role is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

