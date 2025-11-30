import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { GroupService } from '../services/group.service';
import { EnrollmentService } from '../services/enrollment.service';
import { TeachingAssignmentService } from '../services/teaching-assignment.service';
import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';

@Controller('groups')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly enrollmentService: EnrollmentService,
    private readonly teachingAssignmentService: TeachingAssignmentService,
  ) {}

  @Post()
  create(@Body(ValidationPipe) createGroupDto: CreateGroupDto) {
    return this.groupService.create(createGroupDto);
  }

  @Get()
  findAll(@Query('courseId') courseId?: string) {
    if (courseId) {
      return this.groupService.findByCourse(courseId);
    }
    return this.groupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupService.findOne(id);
  }

  @Get(':id/students')
  getStudents(@Param('id') id: string) {
    return this.enrollmentService.getStudentsByGroup(id);
  }

  @Get(':id/teacher')
  getTeacher(@Param('id') id: string, @Query('academicTerm') academicTerm?: string) {
    return this.teachingAssignmentService.getGroupTeacher(id, academicTerm);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(ValidationPipe) updateGroupDto: UpdateGroupDto) {
    return this.groupService.update(id, updateGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupService.remove(id);
  }
}
