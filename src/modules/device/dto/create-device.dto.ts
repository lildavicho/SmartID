import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeviceDto {
  @ApiProperty({
    description: 'Unique device code',
    example: 'DEV001',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^DEV[0-9]{3,}$/, {
    message: 'Device code must follow the format DEV001, DEV002, etc.',
  })
  deviceCode: string;

  @ApiProperty({
    description: 'Device serial number',
    example: 'SN123456789',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber: string;

  @ApiProperty({
    description: 'Device model',
    example: 'BiometricReader-X1',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model: string;

  @ApiPropertyOptional({
    description: 'Firmware version',
    example: '1.0.5',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  firmwareVersion?: string;

  @ApiPropertyOptional({
    description: 'Campus ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  campusId?: string;
}
