import { IsUUID, IsNotEmpty, IsEnum, IsObject } from 'class-validator';
import { IntegrationProvider } from '../enums/integration-provider.enum';

export class CreateIntegrationDto {
  @IsUUID()
  @IsNotEmpty()
  institutionId: string;

  @IsEnum(IntegrationProvider)
  @IsNotEmpty()
  provider: IntegrationProvider;

  @IsObject()
  @IsNotEmpty()
  config: Record<string, any>;

  @IsObject()
  @IsNotEmpty()
  credentials: Record<string, any>;
}
