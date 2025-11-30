import { Controller, Get, Post, Body, Param, Delete, ValidationPipe } from '@nestjs/common';
import { EnrollmentService } from '../services/enrollment.service';
import { EnrollStudentDto } from '../dto/enroll-student.dto';

@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  enrollStudent(@Body(ValidationPipe) enrollStudentDto: EnrollStudentDto) {
    return this.enrollmentService.enrollStudent(enrollStudentDto);
  }

  @Get()
  findAll() {
    return this.enrollmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentService.findOne(id);
  }

  @Delete(':id')
  unenrollStudent(@Param('id') id: string) {
    return this.enrollmentService.unenrollStudent(id);
  }
}
