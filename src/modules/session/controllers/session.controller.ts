import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SessionService } from '../services/session.service';
import { SnapshotService } from '../services/snapshot.service';
import { AttendanceService } from '../services/attendance.service';
import { StartSessionDto } from '../dto/start-session.dto';
import { CloseSessionDto } from '../dto/close-session.dto';
import { CreateSnapshotDto } from '../dto/create-snapshot.dto';
import { UpdateAttendanceDto } from '../dto/update-attendance.dto';
import { SessionFiltersDto } from '../dto/session-filters.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly snapshotService: SnapshotService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new class session' })
  @ApiResponse({ status: 201, description: 'Session started successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  async startSession(@Body(ValidationPipe) startSessionDto: StartSessionDto) {
    return await this.sessionService.startSession(startSessionDto);
  }

  @Post(':id/snapshots')
  @ApiOperation({ summary: 'Create attendance snapshot for a session' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @ApiResponse({ status: 201, description: 'Snapshot created successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async createSnapshot(
    @Param('id') sessionId: string,
    @Body(ValidationPipe) createSnapshotDto: CreateSnapshotDto,
  ) {
    // Ensure sessionId matches
    createSnapshotDto.sessionId = sessionId;
    return await this.snapshotService.createSnapshot(createSnapshotDto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close a session and calculate attendance' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Session closed successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session already closed' })
  async closeSession(
    @Param('id') sessionId: string,
    @Body(ValidationPipe) closeSessionDto: CloseSessionDto,
  ) {
    // Ensure sessionId matches
    closeSessionDto.sessionId = sessionId;
    return await this.sessionService.closeSession(closeSessionDto);
  }

  @Patch(':id/attendance/:studentId')
  @ApiOperation({ summary: 'Apply manual correction to student attendance' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Attendance updated successfully' })
  @ApiResponse({ status: 404, description: 'Session or student not found' })
  async updateAttendance(
    @Param('id') sessionId: string,
    @Param('studentId') studentId: string,
    @Body(ValidationPipe) updateAttendanceDto: UpdateAttendanceDto,
  ) {
    // Ensure studentId matches
    updateAttendanceDto.studentId = studentId;

    return await this.attendanceService.applyManualCorrection(
      sessionId,
      updateAttendanceDto.studentId,
      updateAttendanceDto.status,
      updateAttendanceDto.arrivalTime ? new Date(updateAttendanceDto.arrivalTime) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session details by ID' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Session found' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSessionDetails(@Param('id') id: string) {
    return await this.sessionService.getSessionDetails(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sessions with filters' })
  @ApiResponse({ status: 200, description: 'List of sessions retrieved successfully' })
  async findAll(@Query(ValidationPipe) filters: SessionFiltersDto) {
    return await this.sessionService.findAll(filters);
  }

  @Get(':id/attendance')
  @ApiOperation({ summary: 'Get attendance records for a session' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Attendance records retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getAttendance(@Param('id') sessionId: string) {
    return await this.attendanceService.getAttendanceBySession(sessionId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a session' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Session cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Cannot cancel a closed session' })
  async cancelSession(@Param('id') sessionId: string) {
    return await this.sessionService.cancelSession(sessionId);
  }
}
