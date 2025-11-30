import { Controller, Get, Query } from '@nestjs/common';
import { ReportingService } from './reporting.service';

@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('attendance')
  getAttendanceReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportingService.getAttendanceReport(startDate, endDate);
  }

  @Get('summary')
  getSummaryReport() {
    return this.reportingService.getSummaryReport();
  }
}
