import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class BindDeviceToClassroomDto {
  @ApiProperty({
    description: 'Classroom ID to bind the device to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  classroomId: string;
}
