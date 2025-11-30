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
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SessionService } from '../services/session.service';
import { SnapshotService } from '../services/snapshot.service';
import { AttendanceService } from '../services/attendance.service';
import { StartSessionDto } from '../dto/start-session.dto';
import { CloseSessionDto } from '../dto/close-session.dto';
import { CreateSnapshotDto } from '../dto/create-snapshot.dto';
import { SendSnapshotDto } from '../dto/snapshot.dto';
import { UpdateAttendanceDto } from '../dto/update-attendance.dto';
import { SessionFiltersDto } from '../dto/session-filters.dto';
import { UpcomingSessionResponseDto } from '../dto/upcoming-session-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../user/enums/user-role.enum';
import { CurrentUser, CurrentUserData } from '../../../common/decorators/current-user.decorator';

@ApiTags('Sessions (Android)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly snapshotService: SnapshotService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Post('start')
  @ApiOperation({ summary: 'Iniciar una nueva sesión de clase (usado por Android)' })
  @ApiResponse({ status: 201, description: 'Sesión iniciada exitosamente' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async startSession(
    @Body(ValidationPipe) dto: StartSessionDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.sessionService.startSession(dto, user.userId);
  }

  @Post('snapshot')
  @ApiOperation({ summary: 'Enviar snapshot de detección (usado por Android cada 5s)' })
  @ApiResponse({ status: 201, description: 'Snapshot registrado' })
  @UseGuards(JwtAuthGuard)
  async sendSnapshot(@Body(ValidationPipe) dto: SendSnapshotDto) {
    return this.sessionService.recordSnapshot(dto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Obtener sesión activa del profesor (para Android)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Sesión activa encontrada o no hay sesión activa',
    schema: {
      example: {
        hasActiveSession: true,
        session: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'IN_PROGRESS',
          groupId: '660e8400-e29b-41d4-a716-446655440001',
          teacherId: '770e8400-e29b-41d4-a716-446655440002',
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'No hay sesión activa',
    schema: {
      example: {
        hasActiveSession: false,
        session: null
      }
    }
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Permite acceso a TEACHER y SUPER_ADMIN (superadmin puede ver sesiones activas)
  @Roles(UserRole.TEACHER, UserRole.SUPER_ADMIN)
  async getActiveSession(@CurrentUser() user: CurrentUserData) {
    // Log del usuario que accede al endpoint
    this.logger.log(
      `GET /sessions/active - Usuario: ${user.email} (ID: ${user.userId}, Rol: ${user.role})`,
    );

    const result = await this.sessionService.getActiveSessionForTeacher(user.userId);

    if (result) {
      this.logger.log(
        `Sesión activa encontrada para usuario ${user.userId}: ${result.id}`,
      );
      return {
        hasActiveSession: true,
        session: result,
      };
    } else {
      this.logger.log(`No hay sesión activa para usuario ${user.userId}`);
      return {
        hasActiveSession: false,
        session: null,
      };
    }
  }

  @Post(':id/start')
  @ApiOperation({
    summary: 'Start an existing class session',
    description:
      'Marks a PENDING session as IN_PROGRESS and stores the actualStart timestamp. ' +
      'Validates that the authenticated teacher owns this session.',
  })
  @ApiParam({ name: 'id', description: 'Session UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Session started successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        groupId: '660e8400-e29b-41d4-a716-446655440001',
        teacherId: '770e8400-e29b-41d4-a716-446655440002',
        classroomId: '880e8400-e29b-41d4-a716-446655440003',
        scheduledStart: '2024-01-15T08:00:00Z',
        scheduledEnd: '2024-01-15T10:00:00Z',
        actualStart: '2024-01-15T08:02:30Z',
        actualEnd: null,
        status: 'IN_PROGRESS',
        createdAt: '2024-01-14T10:00:00Z',
        updatedAt: '2024-01-15T08:02:30Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Not authorized or invalid session status' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async startExistingSession(
    @Param('id') sessionId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return await this.sessionService.startExistingSession(sessionId, user.userId);
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
  @ApiOperation({ summary: 'Cerrar sesión y calcular asistencia final' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada y asistencia calculada' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async closeSession(
    @Param('id') id: string,
    @Body(ValidationPipe) closeSessionDto: CloseSessionDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    // Ensure sessionId matches
    closeSessionDto.sessionId = id;
    return this.sessionService.closeSession(closeSessionDto, user.userId);
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
  @ApiOperation({
    summary: 'Get full session details by ID',
    description:
      'Returns complete session information including course, group, classroom, teacher, ' +
      'attendance snapshots, attendance records, scheduled and actual times, and status.',
  })
  @ApiParam({ name: 'id', description: 'Session UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Session found with full details',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        groupId: '660e8400-e29b-41d4-a716-446655440001',
        teacherId: '770e8400-e29b-41d4-a716-446655440002',
        classroomId: '880e8400-e29b-41d4-a716-446655440003',
        deviceId: '990e8400-e29b-41d4-a716-446655440004',
        scheduledStart: '2024-01-15T08:00:00Z',
        scheduledEnd: '2024-01-15T10:00:00Z',
        actualStart: '2024-01-15T08:02:30Z',
        actualEnd: '2024-01-15T10:05:00Z',
        status: 'CLOSED',
        createdAt: '2024-01-14T10:00:00Z',
        updatedAt: '2024-01-15T10:05:00Z',
        group: {
          id: '660e8400-e29b-41d4-a716-446655440001',
          name: 'Group A',
          academicTerm: '2024-1',
          course: {
            id: 'aa0e8400-e29b-41d4-a716-446655440005',
            name: 'Introduction to Computer Science',
            code: 'CS101',
            grade: '10',
          },
        },
        teacher: {
          id: '770e8400-e29b-41d4-a716-446655440002',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@school.edu',
        },
        classroom: {
          id: '880e8400-e29b-41d4-a716-446655440003',
          name: 'Room 301',
          building: 'Main Building',
          capacity: 30,
        },
        snapshots: [],
        attendanceRecords: [],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
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

  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming sessions for the current teacher',
    description:
      'Returns all upcoming and today sessions for the authenticated teacher. ' +
      'Sessions are filtered by SCHEDULED or ACTIVE status and ordered by start time. ' +
      'Only camera-based attendance sessions are included.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming sessions retrieved successfully',
    type: [UpcomingSessionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getUpcomingSessions(
    @CurrentUser() user: CurrentUserData,
  ): Promise<UpcomingSessionResponseDto[]> {
    // For teachers, use their roleId (teacherId) to fetch sessions
    // For other roles, this would need additional logic
    const teacherId = user.userId; // Assuming userId maps to teacherId for teacher role
    return await this.sessionService.getUpcomingSessions(teacherId);
  }
}
