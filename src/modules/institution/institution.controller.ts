import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
import { InstitutionService, PaginatedResult } from './institution.service';
import { CreateInstitutionDto, UpdateInstitutionDto, QueryInstitutionDto } from './dto';
import { Institution, Campus } from './entities';

@ApiTags('institutions')
@ApiBearerAuth()
@Controller('institutions')
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new institution' })
  @ApiResponse({
    status: 201,
    description: 'Institution created successfully',
    type: Institution,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 409, description: 'Conflict - Code already exists' })
  create(@Body() createInstitutionDto: CreateInstitutionDto): Promise<Institution> {
    return this.institutionService.create(createInstitutionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all institutions with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'List of institutions retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(@Query() query: QueryInstitutionDto): Promise<PaginatedResult<Institution>> {
    return this.institutionService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an institution by ID' })
  @ApiParam({ name: 'id', description: 'Institution UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Institution found',
    type: Institution,
  })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Institution> {
    return this.institutionService.findOne(id);
  }

  @Get(':id/campuses')
  @ApiOperation({ summary: 'Get all campuses for an institution' })
  @ApiParam({ name: 'id', description: 'Institution UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of campuses retrieved successfully',
    type: [Campus],
  })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  getCampuses(@Param('id', ParseUUIDPipe) id: string): Promise<Campus[]> {
    return this.institutionService.getCampuses(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an institution' })
  @ApiParam({ name: 'id', description: 'Institution UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Institution updated successfully',
    type: Institution,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Code already exists' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInstitutionDto: UpdateInstitutionDto,
  ): Promise<Institution> {
    return this.institutionService.update(id, updateInstitutionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an institution' })
  @ApiParam({ name: 'id', description: 'Institution UUID', type: String })
  @ApiResponse({ status: 204, description: 'Institution deleted successfully' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Institution has associated campuses',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.institutionService.remove(id);
  }
}
