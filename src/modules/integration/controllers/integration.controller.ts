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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { IntegrationService } from '../services/integration.service';
import { MappingService } from '../services/mapping.service';
import { CreateIntegrationDto } from '../dto/create-integration.dto';
import { UpdateIntegrationDto } from '../dto/update-integration.dto';
import { SyncDto } from '../dto/sync.dto';
import { SendAttendanceDto } from '../dto/send-attendance.dto';
import { MappingEntityType } from '../enums/mapping-entity-type.enum';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationController {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly mappingService: MappingService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new integration' })
  @ApiResponse({ status: 201, description: 'Integration created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Provider not supported' })
  create(@Body(ValidationPipe) createIntegrationDto: CreateIntegrationDto) {
    return this.integrationService.createIntegration(createIntegrationDto);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test connection to external SIS' })
  @ApiParam({ name: 'id', description: 'Integration UUID' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  testConnection(@Param('id') id: string) {
    return this.integrationService.testConnection(id);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync data from external SIS' })
  @ApiParam({ name: 'id', description: 'Integration UUID' })
  @ApiResponse({ status: 200, description: 'Sync completed successfully' })
  @ApiResponse({ status: 400, description: 'Integration not active' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  syncData(@Param('id') id: string, @Body(ValidationPipe) syncDto: SyncDto) {
    // Ensure integrationId matches
    syncDto.integrationId = id;
    return this.integrationService.syncData(id, syncDto.entityType);
  }

  @Post(':id/send-attendance')
  @ApiOperation({ summary: 'Send attendance to external SIS' })
  @ApiParam({ name: 'id', description: 'Integration UUID' })
  @ApiResponse({ status: 200, description: 'Attendance sent successfully' })
  @ApiResponse({ status: 400, description: 'Integration not active' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  sendAttendance(
    @Param('id') id: string,
    @Body(ValidationPipe) sendAttendanceDto: SendAttendanceDto,
  ) {
    // Ensure integrationId matches
    sendAttendanceDto.integrationId = id;
    return this.integrationService.sendAttendance(id, sendAttendanceDto.sessionId);
  }

  @Get(':id/mappings')
  @ApiOperation({ summary: 'Get entity mappings for integration' })
  @ApiParam({ name: 'id', description: 'Integration UUID' })
  @ApiResponse({ status: 200, description: 'Mappings retrieved successfully' })
  getMappings(@Param('id') id: string, @Query('entityType') entityType?: MappingEntityType) {
    return this.mappingService.getMappingsByIntegration(id, entityType);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get sync logs for integration' })
  @ApiParam({ name: 'id', description: 'Integration UUID' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  getSyncLogs(@Param('id') id: string) {
    return this.integrationService.getSyncLogs(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all integrations' })
  @ApiResponse({ status: 200, description: 'List of integrations retrieved successfully' })
  findAll(@Query('institutionId') institutionId?: string) {
    return this.integrationService.findAll(institutionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get integration by ID' })
  @ApiParam({ name: 'id', description: 'Integration UUID' })
  @ApiResponse({ status: 200, description: 'Integration found' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  findOne(@Param('id') id: string) {
    return this.integrationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an integration' })
  @ApiParam({ name: 'id', description: 'Integration UUID' })
  @ApiResponse({ status: 200, description: 'Integration updated successfully' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateIntegrationDto: UpdateIntegrationDto,
  ) {
    return this.integrationService.update(id, updateIntegrationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an integration' })
  @ApiParam({ name: 'id', description: 'Integration UUID' })
  @ApiResponse({ status: 200, description: 'Integration deleted successfully' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  remove(@Param('id') id: string) {
    return this.integrationService.remove(id);
  }
}
