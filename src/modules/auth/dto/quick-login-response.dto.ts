import { ApiProperty } from '@nestjs/swagger';

export class TeacherInfoDto {
  @ApiProperty({ description: 'Teacher UUID' })
  id: string;

  @ApiProperty({ description: 'Teacher first name' })
  firstName: string;

  @ApiProperty({ description: 'Teacher last name' })
  lastName: string;

  @ApiProperty({ description: 'Teacher email' })
  email: string;

  @ApiProperty({ description: 'Employee code' })
  employeeCode: string;

  @ApiProperty({ description: 'Institution UUID' })
  institutionId: string;
}

export class QuickLoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;

  @ApiProperty({ type: TeacherInfoDto, description: 'Teacher information' })
  teacher: TeacherInfoDto;
}

