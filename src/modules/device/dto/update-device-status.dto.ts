import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { DeviceStatus } from '../enums';

export class UpdateDeviceStatusDto {
  @ApiProperty({
    description: 'New device status',
    enum: DeviceStatus,
    example: DeviceStatus.ONLINE,
  })
  @IsEnum(DeviceStatus)
  @IsNotEmpty()
  status: DeviceStatus;
}
