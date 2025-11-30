import { Controller, Get, Post, Body, Param, Delete, Query, ValidationPipe } from '@nestjs/common';
import { TeachingAssignmentService } from '../services/teaching-assignment.service';
import { AssignTeacherDto } from '../dto/assign-teacher.dto';

@Controller('teaching-assignments')
export class TeachingAssignmentController {
  constructor(private readonly teachingAssignmentService: TeachingAssignmentService) {}

  @Post()
  assignTeacher(@Body(ValidationPipe) assignTeacherDto: AssignTeacherDto) {
    return this.teachingAssignmentService.assignTeacher(assignTeacherDto);
  }

  @Get()
  findAll(@Query('teacherId') teacherId?: string) {
    if (teacherId) {
      return this.teachingAssignmentService.getTeacherAssignments(teacherId);
    }
    return this.teachingAssignmentService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teachingAssignmentService.remove(id);
  }
}
