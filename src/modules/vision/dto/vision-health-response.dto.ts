import { ApiProperty } from '@nestjs/swagger';

export class VisionHealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 'yolov8n', required: false })
  model?: string;

  @ApiProperty({ example: 'cuda:0', required: false })
  device?: string;
}

