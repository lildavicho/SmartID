import { PartialType } from '@nestjs/swagger';
import { CreateCampusDto } from './create-campus.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateCampusDto extends PartialType(
  OmitType(CreateCampusDto, ['institutionId'] as const),
) {}
