import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { ConflictException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.TEACHER,
    };

    it('should hash password and create user', async () => {
      const hashedPassword = 'hashed_password';
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve(hashedPassword as never));

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        ...registerDto,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
      });
      mockUserRepository.save.mockResolvedValue({
        id: 'user-uuid',
        ...registerDto,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
      });

      const result = await service.create(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(result.password).toBe(hashedPassword);
      expect(result.password).not.toBe(registerDto.password);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ email: registerDto.email });

      await expect(service.create(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const result = await service.verifyPassword(plainPassword, hashedPassword);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const plainPassword = 'password123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const result = await service.verifyPassword(wrongPassword, hashedPassword);

      expect(result).toBe(false);
    });
  });

  describe('findByEmail', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update password with hashed value', async () => {
      const userId = 'user-uuid';
      const newPassword = 'newpassword123';
      const hashedPassword = 'new_hashed_password';

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password: 'old_hashed_password',
      };

      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve(hashedPassword as never));
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.updatePassword(userId, newPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(result.password).toBe(hashedPassword);
    });
  });
});
