import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../../user/services/user.service';
import { LoginDto } from '../../user/dto/login.dto';
import { RegisterDto } from '../../user/dto/register.dto';
import { User } from '../../user/entities/user.entity';
import { UserStatus } from '../../user/enums/user-status.enum';
import { UserRole } from '../../user/enums/user-role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 'user-uuid',
    email: 'test@example.com',
    password: 'hashed_password',
    firstName: 'Test',
    lastName: 'User',
    legacyRole: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    isActive: true,
    institutionId: null,
    roleId: null,
    role: null,
    phone: null,
    lastLoginAt: null,
    avatarUrl: null,
    nfcTags: [],
    refreshTokens: [],
    sessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            verifyPassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.TEACHER,
    };

    it('should register a new user successfully', async () => {
      userService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.register(registerDto);

      expect(userService.create).toHaveBeenCalledWith(registerDto);
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw error if user creation fails', async () => {
      userService.create.mockRejectedValue(new Error('User creation failed'));

      await expect(service.register(registerDto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login user successfully with valid credentials', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      userService.verifyPassword.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(loginDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(userService.verifyPassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      userService.verifyPassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };
      userService.findByEmail.mockResolvedValue(inactiveUser);
      userService.verifyPassword.mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      userService.verifyPassword.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user', async () => {
      userService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null for wrong password', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      userService.verifyPassword.mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('generateJWT', () => {
    it('should generate JWT token with correct payload', async () => {
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const token = await service.generateJWT(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.legacyRole,
        roleId: mockUser.roleId,
      });
      expect(token).toBe('mock-jwt-token');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const payload = { sub: 'user-uuid', email: 'test@example.com', role: 'TEACHER' };
      jwtService.verify.mockReturnValue(payload);

      const result = await service.verifyToken('valid-token');

      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
