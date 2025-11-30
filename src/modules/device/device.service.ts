import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
  QueryDeviceDto,
  DeviceHeartbeatDto,
  UpdateDeviceStatusDto,
  BindDeviceToClassroomDto,
} from './dto';
import { Device, Classroom } from './entities';
import { DeviceStatus } from './enums';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
  ) {}

  /**
   * Register a new device
   */
  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    // Validate unique deviceCode
    await this.validateUniqueDeviceCode(createDeviceDto.deviceCode);

    // Validate unique serialNumber
    await this.validateUniqueSerialNumber(createDeviceDto.serialNumber);

    const device = this.deviceRepository.create({
      ...createDeviceDto,
      status: DeviceStatus.OFFLINE,
    });
    return await this.deviceRepository.save(device);
  }

  /**
   * Find all devices with pagination and filters
   */
  async findAll(query: QueryDeviceDto): Promise<PaginatedResult<Device>> {
    const { page = 1, limit = 10, campusId, status, classroomId } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.classroom', 'classroom');

    // Apply filters
    if (campusId) {
      queryBuilder.andWhere('device.campusId = :campusId', { campusId });
    }

    if (status) {
      queryBuilder.andWhere('device.status = :status', { status });
    }

    if (classroomId) {
      queryBuilder.andWhere('device.classroomId = :classroomId', {
        classroomId,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Order by creation date
    queryBuilder.orderBy('device.createdAt', 'DESC');

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find one device by ID
   */
  async findOne(id: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { id },
      relations: ['classroom'],
    });

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    return device;
  }

  /**
   * Update device
   */
  async update(id: string, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
    const device = await this.findOne(id);

    // Validate unique deviceCode if changing
    if (updateDeviceDto.deviceCode && updateDeviceDto.deviceCode !== device.deviceCode) {
      await this.validateUniqueDeviceCode(updateDeviceDto.deviceCode);
    }

    // Validate unique serialNumber if changing
    if (updateDeviceDto.serialNumber && updateDeviceDto.serialNumber !== device.serialNumber) {
      await this.validateUniqueSerialNumber(updateDeviceDto.serialNumber);
    }

    await this.deviceRepository.update(id, updateDeviceDto);
    return this.findOne(id);
  }

  /**
   * Remove device
   */
  async remove(id: string): Promise<void> {
    const device = await this.findOne(id);
    await this.deviceRepository.remove(device);
  }

  /**
   * Update device heartbeat (lastSeen timestamp)
   */
  async updateHeartbeat(id: string, heartbeatDto?: DeviceHeartbeatDto): Promise<Device> {
    const device = await this.findOne(id);

    const updateData: Partial<Device> = {
      lastSeen: new Date(),
    };

    // Update status if provided
    if (heartbeatDto?.status) {
      updateData.status = heartbeatDto.status;
    } else if (device.status === DeviceStatus.OFFLINE) {
      // Auto-set to ONLINE if currently OFFLINE
      updateData.status = DeviceStatus.ONLINE;
    }

    await this.deviceRepository.update(id, updateData);
    return this.findOne(id);
  }

  /**
   * Update device status
   */
  async updateStatus(id: string, updateStatusDto: UpdateDeviceStatusDto): Promise<Device> {
    await this.findOne(id);
    await this.deviceRepository.update(id, { status: updateStatusDto.status });
    return this.findOne(id);
  }

  /**
   * Bind device to classroom
   */
  async bindToClassroom(id: string, bindDto: BindDeviceToClassroomDto): Promise<Device> {
    const device = await this.findOne(id);

    // Verify classroom exists
    const classroom = await this.classroomRepository.findOne({
      where: { id: bindDto.classroomId },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${bindDto.classroomId} not found`);
    }

    // Verify classroom belongs to device's campus if device has campusId
    if (device.campusId && classroom.campusId !== device.campusId) {
      throw new BadRequestException(`Classroom does not belong to the same campus as the device`);
    }

    await this.deviceRepository.update(id, {
      classroomId: bindDto.classroomId,
      campusId: classroom.campusId, // Update campusId from classroom
    });

    return this.findOne(id);
  }

  /**
   * Get devices by status
   */
  async getDevicesByStatus(status: DeviceStatus): Promise<Device[]> {
    return await this.deviceRepository.find({
      where: { status },
      relations: ['classroom'],
      order: { lastSeen: 'DESC' },
    });
  }

  /**
   * Validate unique device code
   */
  private async validateUniqueDeviceCode(deviceCode: string): Promise<void> {
    const existing = await this.deviceRepository.findOne({
      where: { deviceCode },
    });

    if (existing) {
      throw new ConflictException(`Device with code '${deviceCode}' already exists`);
    }
  }

  /**
   * Validate unique serial number
   */
  private async validateUniqueSerialNumber(serialNumber: string): Promise<void> {
    const existing = await this.deviceRepository.findOne({
      where: { serialNumber },
    });

    if (existing) {
      throw new ConflictException(`Device with serial number '${serialNumber}' already exists`);
    }
  }
}
