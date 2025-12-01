import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisionController } from './controllers/vision.controller';
import { VisionService } from './services/vision.service';
import { ClassSession } from '../session/entities/class-session.entity';
import { AttendanceSnapshot } from '../session/entities/attendance-snapshot.entity';
import { AttendanceRecord } from '../session/entities/attendance-record.entity';
import { Student } from '../academic/entities/student.entity';
import { Enrollment } from '../academic/entities/enrollment.entity';
import { YoloWebhookGuard } from './guards/yolo-webhook.guard';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
    TypeOrmModule.forFeature([
      ClassSession,
      AttendanceSnapshot,
      AttendanceRecord,
      Student,
      Enrollment,
    ]),
  ],
  controllers: [VisionController],
  providers: [VisionService, YoloWebhookGuard],
  exports: [VisionService],
})
export class VisionModule {}

