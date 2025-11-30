import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AttendanceLog, AttendanceType, AttendanceMethod } from '../entities/attendance-log.entity';
import { CreateAttendanceLogDto } from '../dto/create-attendance-log.dto';

export interface AttendanceQuery {
  institutionId?: string;
  userId?: string;
  deviceId?: string;
  type?: AttendanceType;
  method?: AttendanceMethod;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedAttendanceLogs {
  data: AttendanceLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AttendanceLogService {
  private readonly logger = new Logger(AttendanceLogService.name);

  constructor(
    @InjectRepository(AttendanceLog)
    private readonly attendanceLogRepository: Repository<AttendanceLog>,
  ) {}

  async create(createDto: CreateAttendanceLogDto): Promise<AttendanceLog> {
    const attendanceLog = this.attendanceLogRepository.create({
      ...createDto,
      timestamp: createDto.timestamp ? new Date(createDto.timestamp) : new Date(),
    });
    
    this.logger.log(
      `Recording ${createDto.type} for user ${createDto.userId} via ${createDto.method || 'NFC'}`,
    );
    
    return this.attendanceLogRepository.save(attendanceLog);
  }

  async checkIn(
    userId: string,
    deviceId: string,
    institutionId: string,
    method: AttendanceMethod = AttendanceMethod.NFC,
    metadata?: Record<string, any>,
  ): Promise<AttendanceLog> {
    return this.create({
      userId,
      deviceId,
      institutionId,
      type: AttendanceType.CHECK_IN,
      method,
      metadata,
    });
  }

  async checkOut(
    userId: string,
    deviceId: string,
    institutionId: string,
    method: AttendanceMethod = AttendanceMethod.NFC,
    metadata?: Record<string, any>,
  ): Promise<AttendanceLog> {
    return this.create({
      userId,
      deviceId,
      institutionId,
      type: AttendanceType.CHECK_OUT,
      method,
      metadata,
    });
  }

  async findAll(query: AttendanceQuery): Promise<PaginatedAttendanceLogs> {
    const {
      institutionId,
      userId,
      deviceId,
      type,
      method,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = query;

    const queryBuilder = this.attendanceLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .leftJoinAndSelect('log.device', 'device')
      .orderBy('log.timestamp', 'DESC');

    if (institutionId) {
      queryBuilder.andWhere('log.institutionId = :institutionId', { institutionId });
    }

    if (userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId });
    }

    if (deviceId) {
      queryBuilder.andWhere('log.deviceId = :deviceId', { deviceId });
    }

    if (type) {
      queryBuilder.andWhere('log.type = :type', { type });
    }

    if (method) {
      queryBuilder.andWhere('log.method = :method', { method });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('log.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('log.timestamp >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('log.timestamp <= :endDate', { endDate });
    }

    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / limit);

    queryBuilder.skip((page - 1) * limit).take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<AttendanceLog> {
    const log = await this.attendanceLogRepository.findOne({
      where: { id },
      relations: ['user', 'device'],
    });

    if (!log) {
      throw new NotFoundException(`Attendance log with ID '${id}' not found`);
    }

    return log;
  }

  async getLastCheckIn(userId: string): Promise<AttendanceLog | null> {
    return this.attendanceLogRepository.findOne({
      where: { userId, type: AttendanceType.CHECK_IN },
      order: { timestamp: 'DESC' },
    });
  }

  async getLastCheckOut(userId: string): Promise<AttendanceLog | null> {
    return this.attendanceLogRepository.findOne({
      where: { userId, type: AttendanceType.CHECK_OUT },
      order: { timestamp: 'DESC' },
    });
  }

  async getTodayAttendance(userId: string): Promise<AttendanceLog[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.attendanceLogRepository.find({
      where: {
        userId,
        timestamp: Between(today, tomorrow),
      },
      order: { timestamp: 'ASC' },
    });
  }

  async getAttendanceSummary(
    institutionId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ checkIns: number; checkOuts: number; uniqueUsers: number }> {
    const checkIns = await this.attendanceLogRepository.count({
      where: {
        institutionId,
        type: AttendanceType.CHECK_IN,
        timestamp: Between(startDate, endDate),
      },
    });

    const checkOuts = await this.attendanceLogRepository.count({
      where: {
        institutionId,
        type: AttendanceType.CHECK_OUT,
        timestamp: Between(startDate, endDate),
      },
    });

    const uniqueUsersResult = await this.attendanceLogRepository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.userId)', 'count')
      .where('log.institutionId = :institutionId', { institutionId })
      .andWhere('log.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    return {
      checkIns,
      checkOuts,
      uniqueUsers: parseInt(uniqueUsersResult?.count || '0', 10),
    };
  }
}

