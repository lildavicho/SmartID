import { IsUUID, IsNotEmpty } from 'class-validator';

export class TestConnectionDto {
  @IsUUID()
  @IsNotEmpty()
  integrationId: string;
}
