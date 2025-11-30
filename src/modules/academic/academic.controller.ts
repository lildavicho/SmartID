import { Controller, Get, Param } from '@nestjs/common';
import { AcademicService } from './academic.service';

@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Get('courses')
  findAllCourses() {
    return this.academicService.findAllCourses();
  }

  @Get('students')
  findAllStudents() {
    return this.academicService.findAllStudents();
  }

  @Get('courses/:id')
  findOneCourse(@Param('id') id: string) {
    return this.academicService.findOneCourse(id);
  }

  @Get('students/:id')
  findOneStudent(@Param('id') id: string) {
    return this.academicService.findOneStudent(id);
  }
}
