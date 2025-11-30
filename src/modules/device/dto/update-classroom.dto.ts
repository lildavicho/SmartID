import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateClassroomDto } from './create-classroom.dto';

export class UpdateClassroomDto extends PartialType(
  OmitType(CreateClassroomDto, ['campusId'] as const),
) {}
