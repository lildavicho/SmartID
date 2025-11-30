import { Controller, Get, Query, Param, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportingService } from '../services/reporting.service';
import { ExportService } from '../services/export.service';
import { DailyReportFiltersDto, CourseReportFiltersDto, TeacherReportFiltersDto } from '../dto';
import { ExportFormat } from '../enums/export-format.enum';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly exportService: ExportService,
  ) {}

  /**
   * Get daily attendance report
   * GET /reports/daily?institutionId=uuid&date=2025-01-15&format=json
   */
  @Get('daily')
  @ApiOperation({ summary: 'Get daily attendance report' })
  @ApiQuery({ name: 'institutionId', required: true, type: String })
  @ApiQuery({ name: 'date', required: true, type: String, example: '2025-01-15' })
  @ApiQuery({ name: 'format', required: false, enum: ExportFormat, example: 'json' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  async getDailyReport(
    @Query(ValidationPipe) filters: DailyReportFiltersDto,
    @Res() res: Response,
  ) {
    const report = await this.reportingService.generateDailyAttendanceReport(
      filters.institutionId,
      filters.date,
    );

    const format = filters.format || ExportFormat.JSON;

    switch (format) {
      case ExportFormat.XLSX:
        const excelBuffer = await this.exportService.exportToExcel(report, 'daily');
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="daily-report-${filters.date}.xlsx"`,
        );
        return res.send(excelBuffer);

      case ExportFormat.PDF:
        const pdfBuffer = await this.exportService.exportToPDF(report, 'daily');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="daily-report-${filters.date}.pdf"`,
        );
        return res.send(pdfBuffer);

      case ExportFormat.JSON:
      default:
        return res.json(report);
    }
  }

  /**
   * Get course report
   * GET /reports/course/:groupId?startDate=2025-01-01&endDate=2025-01-31&format=xlsx
   */
  @Get('course/:groupId')
  @ApiOperation({ summary: 'Get course attendance report' })
  @ApiParam({ name: 'groupId', description: 'Group/Course UUID' })
  @ApiQuery({ name: 'startDate', required: true, type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: true, type: String, example: '2025-01-31' })
  @ApiQuery({ name: 'format', required: false, enum: ExportFormat, example: 'xlsx' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  async getCourseReport(
    @Param('groupId') groupId: string,
    @Query(ValidationPipe) filters: Omit<CourseReportFiltersDto, 'groupId'>,
    @Res() res: Response,
  ) {
    const report = await this.reportingService.generateCourseReport(
      groupId,
      filters.startDate,
      filters.endDate,
    );

    const format = filters.format || ExportFormat.JSON;
    const filename = `course-report-${groupId.substring(0, 8)}-${filters.startDate}-${filters.endDate}`;

    switch (format) {
      case ExportFormat.XLSX:
        const excelBuffer = await this.exportService.exportToExcel(report, 'course');
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        return res.send(excelBuffer);

      case ExportFormat.PDF:
        const pdfBuffer = await this.exportService.exportToPDF(report, 'course');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        return res.send(pdfBuffer);

      case ExportFormat.JSON:
      default:
        return res.json(report);
    }
  }

  /**
   * Get teacher report
   * GET /reports/teacher/:teacherId?month=1&year=2025&format=pdf
   */
  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Get teacher attendance report' })
  @ApiParam({ name: 'teacherId', description: 'Teacher UUID' })
  @ApiQuery({ name: 'month', required: true, type: Number, example: 1 })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2025 })
  @ApiQuery({ name: 'format', required: false, enum: ExportFormat, example: 'pdf' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  async getTeacherReport(
    @Param('teacherId') teacherId: string,
    @Query(ValidationPipe) filters: Omit<TeacherReportFiltersDto, 'teacherId'>,
    @Res() res: Response,
  ) {
    const report = await this.reportingService.generateTeacherReport(
      teacherId,
      filters.month,
      filters.year,
    );

    const format = filters.format || ExportFormat.JSON;
    const filename = `teacher-report-${teacherId.substring(0, 8)}-${filters.year}-${String(filters.month).padStart(2, '0')}`;

    switch (format) {
      case ExportFormat.XLSX:
        const excelBuffer = await this.exportService.exportToExcel(report, 'teacher');
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        return res.send(excelBuffer);

      case ExportFormat.PDF:
        const pdfBuffer = await this.exportService.exportToPDF(report, 'teacher');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        return res.send(pdfBuffer);

      case ExportFormat.JSON:
      default:
        return res.json(report);
    }
  }
}
