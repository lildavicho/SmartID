import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportingController } from './controllers/reporting.controller';
import { ReportingService } from './services/reporting.service';
import { ExportService } from './services/export.service';
import { AttendanceRecord } from '../session/entities/attendance-record.entity';
import { ClassSession } from '../session/entities/class-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceRecord, ClassSession])],
  controllers: [ReportingController],
  providers: [ReportingService, ExportService],
  exports: [ReportingService, ExportService],
})
export class ReportingModule {}
