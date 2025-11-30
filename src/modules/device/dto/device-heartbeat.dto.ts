import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DeviceStatus } from '../enums';

export class DeviceHeartbeatDto {
  @ApiPropertyOptional({
    description: 'Device status',
    enum: DeviceStatus,
    example: DeviceStatus.ONLINE,
  })
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;
}
