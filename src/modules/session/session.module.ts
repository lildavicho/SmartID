import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassSession } from './entities/class-session.entity';
import { AttendanceSnapshot } from './entities/attendance-snapshot.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { SessionService } from './services/session.service';
import { SnapshotService } from './services/snapshot.service';
import { AttendanceService } from './services/attendance.service';
import { SessionController } from './controllers/session.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClassSession, AttendanceSnapshot, AttendanceRecord])],
  controllers: [SessionController],
  providers: [SessionService, SnapshotService, AttendanceService],
  exports: [SessionService, SnapshotService, AttendanceService],
})
export class SessionModule {}
