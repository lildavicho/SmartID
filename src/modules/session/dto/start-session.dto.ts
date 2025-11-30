import { IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({ description: 'ID del aula donde se realiza la clase' })
  @IsUUID()
  classroomId: string;

  @ApiProperty({ description: 'ID del curso' })
  @IsUUID()
  courseId: string;

  @ApiProperty({ description: 'ID del grupo/sección' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ description: 'Hora programada de inicio', required: false })
  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @ApiProperty({ description: 'Hora programada de fin', required: false })
  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;
}
