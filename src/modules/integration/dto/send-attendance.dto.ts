import { IsUUID, IsNotEmpty } from 'class-validator';

export class SendAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  integrationId: string;

  @IsUUID()
  @IsNotEmpty()
  sessionId: string;
}
