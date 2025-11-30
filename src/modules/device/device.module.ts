import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceController, ClassroomController } from './device.controller';
import { AttendanceLogController } from './controllers/attendance-log.controller';
import { DeviceService } from './device.service';
import { ClassroomService } from './classroom.service';
import { AttendanceLogService } from './services/attendance-log.service';
import { Device, Classroom, AttendanceLog } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Classroom, AttendanceLog])],
  controllers: [DeviceController, ClassroomController, AttendanceLogController],
  providers: [DeviceService, ClassroomService, AttendanceLogService],
  exports: [DeviceService, ClassroomService, AttendanceLogService],
})
export class DeviceModule {}
