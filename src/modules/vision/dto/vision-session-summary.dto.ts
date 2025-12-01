import { ApiProperty } from '@nestjs/swagger';

export class VisionSessionSummaryDto {
  @ApiProperty({ description: 'Session UUID' })
  sessionId: string;

  @ApiProperty({ description: 'Session status', example: 'IN_PROGRESS' })
  status: string;

  @ApiProperty({ description: 'Total students in the class' })
  totalStudents: number;

  @ApiProperty({ description: 'Number of present students' })
  present: number;

  @ApiProperty({ description: 'Number of absent students' })
  absent: number;

  @ApiProperty({ description: 'Last snapshot timestamp', required: false })
  lastSnapshotAt?: string | null;

  @ApiProperty({ description: 'Current occupancy rate (0-1)', example: 0.80 })
  occupancyRate: number;
}

