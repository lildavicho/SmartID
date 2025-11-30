import { ApiProperty } from '@nestjs/swagger';

export class UpcomingSessionResponseDto {
  @ApiProperty({
    description: 'Session UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Course name',
    example: 'Mathematics 101',
  })
  courseName: string;

  @ApiProperty({
    description: 'Group/Section name',
    example: 'Group A',
  })
  groupName: string;

  @ApiProperty({
    description: 'Classroom name',
    example: 'Room 305',
  })
  classroomName: string;

  @ApiProperty({
    description: 'Session start time',
    example: '2025-01-15T08:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  startTime: Date;

  @ApiProperty({
    description: 'Session end time',
    example: '2025-01-15T10:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  endTime: Date;

  @ApiProperty({
    description: 'Session status',
    example: 'SCHEDULED',
    enum: ['SCHEDULED', 'ACTIVE'],
  })
  status: string;

  @ApiProperty({
    description: 'Device UUID (camera device)',
    example: '456e7890-e89b-12d3-a456-426614174001',
    required: false,
    nullable: true,
  })
  deviceId: string | null;
}
