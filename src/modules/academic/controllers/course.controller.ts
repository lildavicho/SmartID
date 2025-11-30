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
import { CourseService } from '../services/course.service';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';

@ApiTags('academic')
@ApiBearerAuth()
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new course',
    description: 'Create a new academic course/subject',
  })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 409, description: 'Conflict - Course code already exists' })
  create(@Body(ValidationPipe) createCourseDto: CreateCourseDto) {
    return this.courseService.create(createCourseDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all courses',
    description: 'Retrieve all courses, optionally filtered by institution',
  })
  @ApiResponse({ status: 200, description: 'List of courses retrieved successfully' })
  @ApiQuery({
    name: 'institutionId',
    required: false,
    type: String,
    description: 'Filter by institution UUID',
  })
  findAll(@Query('institutionId') institutionId?: string) {
    if (institutionId) {
      return this.courseService.findByInstitution(institutionId);
    }
    return this.courseService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a course by ID',
    description: 'Retrieve detailed information about a specific course',
  })
  @ApiParam({ name: 'id', description: 'Course UUID', type: String })
  @ApiResponse({ status: 200, description: 'Course found' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a course',
    description: 'Update course information',
  })
  @ApiParam({ name: 'id', description: 'Course UUID', type: String })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateCourseDto: UpdateCourseDto,
  ) {
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a course',
    description: 'Remove a course from the system',
  })
  @ApiParam({ name: 'id', description: 'Course UUID', type: String })
  @ApiResponse({ status: 204, description: 'Course deleted successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.courseService.remove(id);
  }
}
