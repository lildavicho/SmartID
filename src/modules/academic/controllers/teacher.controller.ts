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
import { TeacherService } from '../services/teacher.service';
import { CreateTeacherDto } from '../dto/create-teacher.dto';
import { UpdateTeacherDto } from '../dto/update-teacher.dto';

@ApiTags('academic')
@ApiBearerAuth()
@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new teacher',
    description: 'Register a new teacher in the system',
  })
  @ApiResponse({ status: 201, description: 'Teacher created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 409, description: 'Conflict - Teacher ID already exists' })
  create(@Body(ValidationPipe) createTeacherDto: CreateTeacherDto) {
    return this.teacherService.create(createTeacherDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all teachers',
    description: 'Retrieve all teachers, optionally filtered by institution',
  })
  @ApiResponse({ status: 200, description: 'List of teachers retrieved successfully' })
  @ApiQuery({
    name: 'institutionId',
    required: false,
    type: String,
    description: 'Filter by institution UUID',
  })
  findAll(@Query('institutionId') institutionId?: string) {
    if (institutionId) {
      return this.teacherService.findByInstitution(institutionId);
    }
    return this.teacherService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a teacher by ID',
    description: 'Retrieve detailed information about a specific teacher',
  })
  @ApiParam({ name: 'id', description: 'Teacher UUID', type: String })
  @ApiResponse({ status: 200, description: 'Teacher found' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teacherService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a teacher',
    description: 'Update teacher information',
  })
  @ApiParam({ name: 'id', description: 'Teacher UUID', type: String })
  @ApiResponse({ status: 200, description: 'Teacher updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateTeacherDto: UpdateTeacherDto,
  ) {
    return this.teacherService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a teacher',
    description: 'Remove a teacher from the system',
  })
  @ApiParam({ name: 'id', description: 'Teacher UUID', type: String })
  @ApiResponse({ status: 204, description: 'Teacher deleted successfully' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.teacherService.remove(id);
  }
}
