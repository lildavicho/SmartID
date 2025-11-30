import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceSnapshot } from '../entities/attendance-snapshot.entity';
import { ClassSession } from '../entities/class-session.entity';
import { CreateSnapshotDto } from '../dto/create-snapshot.dto';

@Injectable()
export class SnapshotService {
  constructor(
    @InjectRepository(AttendanceSnapshot)
    private readonly snapshotRepository: Repository<AttendanceSnapshot>,
    @InjectRepository(ClassSession)
    private readonly sessionRepository: Repository<ClassSession>,
  ) {}

  async createSnapshot(createSnapshotDto: CreateSnapshotDto): Promise<AttendanceSnapshot> {
    const { sessionId, detectedPersons, occupancyRate, confidence, metadata } = createSnapshotDto;

    // Verify session exists
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const snapshot = this.snapshotRepository.create({
      sessionId,
      timestamp: new Date(),
      detectedPersons,
      occupancyRate,
      confidence,
      metadata,
    });

    return await this.snapshotRepository.save(snapshot);
  }

  async getSnapshotsBySession(sessionId: string): Promise<AttendanceSnapshot[]> {
    return await this.snapshotRepository.find({
      where: { sessionId },
      order: { timestamp: 'ASC' },
    });
  }

  async processSnapshots(sessionId: string): Promise<void> {
    // This method is called by AttendanceService to trigger attendance calculation
    // The actual calculation logic is in AttendanceService.calculateAttendanceFromSnapshots
    const snapshots = await this.getSnapshotsBySession(sessionId);

    if (snapshots.length === 0) {
      throw new NotFoundException(`No snapshots found for session ${sessionId}`);
    }

    // Return void - the processing is done by AttendanceService
  }
}
