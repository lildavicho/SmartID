import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendanceLogService, PaginatedAttendanceLogs } from '../services/attendance-log.service';
import { CreateAttendanceLogDto } from '../dto/create-attendance-log.dto';
import { AttendanceLog, AttendanceType, AttendanceMethod } from '../entities/attendance-log.entity';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceLogController {
  constructor(private readonly attendanceLogService: AttendanceLogService) {}

  @Post()
  @ApiOperation({ summary: 'Create attendance log (check-in/check-out)' })
  @ApiResponse({ status: 201, description: 'Attendance logged successfully', type: AttendanceLog })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createDto: CreateAttendanceLogDto): Promise<AttendanceLog> {
    return this.attendanceLogService.create(createDto);
  }

  @Post('check-in')
  @ApiOperation({ summary: 'Record a check-in' })
  @ApiResponse({ status: 201, description: 'Check-in recorded successfully', type: AttendanceLog })
  async checkIn(
    @Body() body: { userId: string; deviceId: string; institutionId: string; method?: AttendanceMethod },
  ): Promise<AttendanceLog> {
    return this.attendanceLogService.checkIn(
      body.userId,
      body.deviceId,
      body.institutionId,
      body.method,
    );
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Record a check-out' })
  @ApiResponse({ status: 201, description: 'Check-out recorded successfully', type: AttendanceLog })
  async checkOut(
    @Body() body: { userId: string; deviceId: string; institutionId: string; method?: AttendanceMethod },
  ): Promise<AttendanceLog> {
    return this.attendanceLogService.checkOut(
      body.userId,
      body.deviceId,
      body.institutionId,
      body.method,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get attendance logs with filters' })
  @ApiQuery({ name: 'institutionId', required: false, type: 'string' })
  @ApiQuery({ name: 'userId', required: false, type: 'string' })
  @ApiQuery({ name: 'deviceId', required: false, type: 'string' })
  @ApiQuery({ name: 'type', required: false, enum: AttendanceType })
  @ApiQuery({ name: 'method', required: false, enum: AttendanceMethod })
  @ApiQuery({ name: 'startDate', required: false, type: 'string' })
  @ApiQuery({ name: 'endDate', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 50 })
  @ApiResponse({ status: 200, description: 'Paginated list of attendance logs' })
  async findAll(
    @Query('institutionId') institutionId?: string,
    @Query('userId') userId?: string,
    @Query('deviceId') deviceId?: string,
    @Query('type') type?: AttendanceType,
    @Query('method') method?: AttendanceMethod,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedAttendanceLogs> {
    return this.attendanceLogService.findAll({
      institutionId,
      userId,
      deviceId,
      type,
      method,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page || 1,
      limit: limit || 50,
    });
  }

  @Get('today/:userId')
  @ApiOperation({ summary: 'Get today\'s attendance for a user' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Today\'s attendance logs', type: [AttendanceLog] })
  async getTodayAttendance(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AttendanceLog[]> {
    return this.attendanceLogService.getTodayAttendance(userId);
  }

  @Get('summary/:institutionId')
  @ApiOperation({ summary: 'Get attendance summary for an institution' })
  @ApiParam({ name: 'institutionId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'startDate', required: true, type: 'string' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string' })
  @ApiResponse({ status: 200, description: 'Attendance summary' })
  async getSummary(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ checkIns: number; checkOuts: number; uniqueUsers: number }> {
    return this.attendanceLogService.getAttendanceSummary(
      institutionId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attendance log by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Attendance log found', type: AttendanceLog })
  @ApiResponse({ status: 404, description: 'Attendance log not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AttendanceLog> {
    return this.attendanceLogService.findOne(id);
  }
}

