import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NfcTagStatus } from '../entities/nfc-tag.entity';

export class CreateNfcTagDto {
  @ApiProperty({
    description: 'Unique NFC tag UID',
    example: '04:A2:B3:C4:D5:E6:F7',
    minLength: 4,
    maxLength: 100,
  })
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  uid: string;

  @ApiPropertyOptional({
    description: 'Label for the NFC tag',
    example: 'Employee Badge #1234',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @ApiPropertyOptional({
    description: 'UUID of the user this tag is assigned to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({
    description: 'Status of the NFC tag',
    enum: NfcTagStatus,
    example: NfcTagStatus.ACTIVE,
    default: NfcTagStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(NfcTagStatus)
  status?: NfcTagStatus;

  @ApiPropertyOptional({
    description: 'Institution ID this tag belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  institutionId?: string;
}

