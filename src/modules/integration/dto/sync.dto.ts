import { IsUUID, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { MappingEntityType } from '../enums/mapping-entity-type.enum';

export class SyncDto {
  @IsUUID()
  @IsNotEmpty()
  integrationId: string;

  @IsEnum(MappingEntityType)
  @IsOptional()
  entityType?: MappingEntityType;
}
