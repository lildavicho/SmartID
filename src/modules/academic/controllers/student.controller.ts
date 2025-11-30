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
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StudentService } from '../services/student.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';

@ApiTags('academic')
@ApiBearerAuth()
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new student',
    description: 'Register a new student in the system',
  })
  @ApiResponse({
    status: 201,
    description: 'Student created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Student ID already exists',
  })
  create(@Body(ValidationPipe) createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all students',
    description: 'Retrieve all students, optionally filtered by institution',
  })
  @ApiResponse({
    status: 200,
    description: 'List of students retrieved successfully',
  })
  @ApiQuery({
    name: 'institutionId',
    required: false,
    type: String,
    description: 'Filter by institution UUID',
  })
  findAll(@Query('institutionId') institutionId?: string) {
    if (institutionId) {
      return this.studentService.findByInstitution(institutionId);
    }
    return this.studentService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a student by ID',
    description: 'Retrieve detailed information about a specific student',
  })
  @ApiParam({ name: 'id', description: 'Student UUID', type: String })
  @ApiResponse({ status: 200, description: 'Student found' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a student',
    description: 'Update student information',
  })
  @ApiParam({ name: 'id', description: 'Student UUID', type: String })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a student',
    description: 'Remove a student from the system',
  })
  @ApiParam({ name: 'id', description: 'Student UUID', type: String })
  @ApiResponse({ status: 204, description: 'Student deleted successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentService.remove(id);
  }
}
