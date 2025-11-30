import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../../user/services/user.service';
import { UserRole } from '../../user/enums/user-role.enum';
import { UserStatus } from '../../user/enums/user-status.enum';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    verifyPassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-uuid',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
      password: 'hashed_password',
    };

    it('should return access token for valid credentials', async () => {
      const token = 'jwt_token';

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: token,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
        },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };

      mockUserService.findByEmail.mockResolvedValue(inactiveUser);
      mockUserService.verifyPassword.mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('User account is not active');
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        password: 'hashed_password',
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid password', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        password: 'hashed_password',
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });
  });

  describe('generateJWT', () => {
    it('should generate JWT with correct payload', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        role: UserRole.TEACHER,
      };

      const token = 'jwt_token';
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.generateJWT(mockUser as any);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toBe(token);
    });
  });
});
