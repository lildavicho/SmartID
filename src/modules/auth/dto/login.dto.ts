import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@smartpresence.ai',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Admin123!',
    minLength: 6,
    maxLength: 100,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}

