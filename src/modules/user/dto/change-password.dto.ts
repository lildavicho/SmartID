import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8, { message: 'Old password must be at least 8 characters long' })
  oldPassword: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(100)
  newPassword: string;
}
