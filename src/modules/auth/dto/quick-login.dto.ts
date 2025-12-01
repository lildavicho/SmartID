import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuickLoginDto {
  @ApiProperty({
    description: 'Employee code of the teacher',
    example: 'PROF-001',
  })
  @IsString()
  employeeCode: string;

  @ApiProperty({
    description: '4-digit PIN code',
    example: '1234',
    minLength: 4,
    maxLength: 4,
  })
  @IsString()
  @Length(4, 4, { message: 'PIN must be exactly 4 digits' })
  pin: string;
}

