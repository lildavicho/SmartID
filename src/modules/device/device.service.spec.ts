import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DeviceService } from './device.service';
import { Device, Classroom } from './entities';
import { DeviceStatus, DeviceType } from './enums';
import {
  CreateDeviceDto,
  QueryDeviceDto,
  DeviceHeartbeatDto,
  UpdateDeviceStatusDto,
  BindDeviceToClassroomDto,
} from './dto';

describe('DeviceService', () => {
  let service: DeviceService;
  let deviceRepository: jest.Mocked<Repository<Device>>;
  let classroomRepository: jest.Mocked<Repository<Classroom>>;

  const mockDevice: Device = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    deviceCode: 'DEV001',
    serialNumber: 'SN123456789',
    model: 'BiometricReader-X1',
    firmwareVersion: '1.0.5',
    type: DeviceType.RIOTOUCH,
    status: DeviceStatus.OFFLINE,
    lastSeen: null,
    institutionId: '123e4567-e89b-12d3-a456-426614174003',
    campusId: '123e4567-e89b-12d3-a456-426614174001',
    classroomId: null,
    classroom: null,
    config: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockClassroom: Classroom = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    campusId: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Aula 101',
    building: 'Edificio A',
    floor: '1',
    capacity: 40,
    devices: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceService,
        {
          provide: getRepositoryToken(Device),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Classroom),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DeviceService>(DeviceService);
    deviceRepository = module.get(getRepositoryToken(Device));
    classroomRepository = module.get(getRepositoryToken(Classroom));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateDeviceDto = {
      deviceCode: 'DEV001',
      serialNumber: 'SN123456789',
      model: 'BiometricReader-X1',
      firmwareVersion: '1.0.5',
      campusId: '123e4567-e89b-12d3-a456-426614174001',
    };

    it('should create a device successfully', async () => {
      deviceRepository.findOne.mockResolvedValue(null);
      deviceRepository.create.mockReturnValue(mockDevice);
      deviceRepository.save.mockResolvedValue(mockDevice);

      const result = await service.create(createDto);

      expect(deviceRepository.findOne).toHaveBeenCalledTimes(2); // deviceCode and serialNumber
      expect(deviceRepository.create).toHaveBeenCalledWith({
        ...createDto,
        status: DeviceStatus.OFFLINE,
      });
      expect(result).toEqual(mockDevice);
    });

    it('should throw ConflictException if deviceCode already exists', async () => {
      deviceRepository.findOne.mockResolvedValueOnce(mockDevice);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(deviceRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if serialNumber already exists', async () => {
      deviceRepository.findOne
        .mockResolvedValueOnce(null) // deviceCode check
        .mockResolvedValueOnce(mockDevice); // serialNumber check

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(deviceRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const query: QueryDeviceDto = {
      page: 1,
      limit: 10,
    };

    it('should return paginated devices', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockDevice]),
      };

      deviceRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: [mockDevice],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply status filter', async () => {
      const queryWithStatus: QueryDeviceDto = {
        ...query,
        status: DeviceStatus.ONLINE,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockDevice]),
      };

      deviceRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      await service.findAll(queryWithStatus);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('device.status = :status', {
        status: DeviceStatus.ONLINE,
      });
    });
  });

  describe('updateHeartbeat', () => {
    it('should update lastSeen timestamp', async () => {
      deviceRepository.findOne.mockResolvedValue(mockDevice);
      deviceRepository.update.mockResolvedValue(undefined as any);

      const result = await service.updateHeartbeat(mockDevice.id);

      expect(deviceRepository.update).toHaveBeenCalledWith(
        mockDevice.id,
        expect.objectContaining({
          lastSeen: expect.any(Date),
          status: DeviceStatus.ONLINE, // Auto-set to ONLINE from OFFLINE
        }),
      );
      expect(result).toEqual(mockDevice);
    });

    it('should update status if provided in heartbeat', async () => {
      const heartbeatDto: DeviceHeartbeatDto = {
        status: DeviceStatus.ERROR,
      };

      deviceRepository.findOne.mockResolvedValue(mockDevice);
      deviceRepository.update.mockResolvedValue(undefined as any);

      await service.updateHeartbeat(mockDevice.id, heartbeatDto);

      expect(deviceRepository.update).toHaveBeenCalledWith(
        mockDevice.id,
        expect.objectContaining({
          lastSeen: expect.any(Date),
          status: DeviceStatus.ERROR,
        }),
      );
    });

    it('should throw NotFoundException if device not found', async () => {
      deviceRepository.findOne.mockResolvedValue(null);

      await expect(service.updateHeartbeat('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('bindToClassroom', () => {
    const bindDto: BindDeviceToClassroomDto = {
      classroomId: mockClassroom.id,
    };

    it('should bind device to classroom successfully', async () => {
      deviceRepository.findOne.mockResolvedValue(mockDevice);
      classroomRepository.findOne.mockResolvedValue(mockClassroom);
      deviceRepository.update.mockResolvedValue(undefined as any);

      const result = await service.bindToClassroom(mockDevice.id, bindDto);

      expect(classroomRepository.findOne).toHaveBeenCalledWith({
        where: { id: bindDto.classroomId },
      });
      expect(deviceRepository.update).toHaveBeenCalledWith(mockDevice.id, {
        classroomId: bindDto.classroomId,
        campusId: mockClassroom.campusId,
      });
      expect(result).toEqual(mockDevice);
    });

    it('should throw NotFoundException if classroom not found', async () => {
      deviceRepository.findOne.mockResolvedValue(mockDevice);
      classroomRepository.findOne.mockResolvedValue(null);

      await expect(service.bindToClassroom(mockDevice.id, bindDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if classroom campus does not match device campus', async () => {
      const deviceWithCampus = {
        ...mockDevice,
        campusId: 'different-campus-id',
      };
      deviceRepository.findOne.mockResolvedValue(deviceWithCampus);
      classroomRepository.findOne.mockResolvedValue(mockClassroom);

      await expect(service.bindToClassroom(mockDevice.id, bindDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatus', () => {
    const updateStatusDto: UpdateDeviceStatusDto = {
      status: DeviceStatus.MAINTENANCE,
    };

    it('should update device status', async () => {
      deviceRepository.findOne.mockResolvedValue(mockDevice);
      deviceRepository.update.mockResolvedValue(undefined as any);

      const result = await service.updateStatus(mockDevice.id, updateStatusDto);

      expect(deviceRepository.update).toHaveBeenCalledWith(mockDevice.id, {
        status: DeviceStatus.MAINTENANCE,
      });
      expect(result).toEqual(mockDevice);
    });
  });

  describe('getDevicesByStatus', () => {
    it('should return devices filtered by status', async () => {
      deviceRepository.find.mockResolvedValue([mockDevice]);

      const result = await service.getDevicesByStatus(DeviceStatus.OFFLINE);

      expect(deviceRepository.find).toHaveBeenCalledWith({
        where: { status: DeviceStatus.OFFLINE },
        relations: ['classroom'],
        order: { lastSeen: 'DESC' },
      });
      expect(result).toEqual([mockDevice]);
    });
  });

  describe('remove', () => {
    it('should remove a device successfully', async () => {
      deviceRepository.findOne.mockResolvedValue(mockDevice);
      deviceRepository.remove.mockResolvedValue(mockDevice);

      await service.remove(mockDevice.id);

      expect(deviceRepository.remove).toHaveBeenCalledWith(mockDevice);
    });

    it('should throw NotFoundException if device not found', async () => {
      deviceRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
