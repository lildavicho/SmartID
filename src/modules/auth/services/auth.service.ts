import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../user/services/user.service';
import { RegisterDto } from '../../user/dto/register.dto';
import { LoginDto } from '../../user/dto/login.dto';
import { User } from '../../user/entities/user.entity';
import { UserStatus } from '../../user/enums/user-status.enum';
import { UserRole } from '../../user/enums/user-role.enum';
import { Teacher } from '../../academic/entities/teacher.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { QuickLoginDto } from '../dto/quick-login.dto';
import { QuickLoginResponseDto, TeacherInfoDto } from '../dto/quick-login-response.dto';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
  roleId?: string;
  schoolId?: string; // institutionId del usuario (opcional)
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    roleId?: string;
  };
}

@Injectable()
export class AuthService {
  private readonly MAX_PIN_ATTEMPTS = 5;
  private readonly PIN_LOCK_MINUTES = 15;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * Get role name from user - handles both legacy role and new Role entity
   */
  private getUserRole(user: User): string {
    if (user.role?.name) {
      return user.role.name;
    }
    return user.legacyRole || 'employee';
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      const user = await this.userService.create(registerDto);
      const token = await this.generateJWT(user);

      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: this.getUserRole(user),
          roleId: user.roleId,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User account is not active');
      }

      const token = await this.generateJWT(user);

      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: this.getUserRole(user),
          roleId: user.roleId,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Login failed');
    }
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.userService.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Generate JWT token
   * Incluye: sub (userId), email, role, roleId, y opcionalmente schoolId (institutionId)
   */
  async generateJWT(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: this.getUserRole(user),
      roleId: user.roleId,
      schoolId: user.institutionId || undefined, // Opcional: solo si el usuario tiene institutionId
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Quick Login by EmployeeCode + PIN
   * 
   * Flujo:
   * 1. Busca profesor por employeeCode
   * 2. Verifica si la cuenta está bloqueada
   * 3. Valida PIN con bcrypt
   * 4. Maneja intentos fallidos y bloqueo
   * 5. Encuentra o crea User asociado al Teacher (por email)
   * 6. Genera access y refresh tokens
   * 7. Retorna información del profesor
   */
  async quickLogin(dto: QuickLoginDto): Promise<QuickLoginResponseDto> {
    const { employeeCode, pin } = dto;

    // 1. Buscar profesor por employeeCode (case-insensitive)
    const teacher = await this.teacherRepository.findOne({
      where: { employeeCode: employeeCode.toUpperCase() },
    });

    if (!teacher) {
      // 404 → employeeCode no encontrado
      throw new NotFoundException('TEACHER_NOT_FOUND');
    }

    // 2. Verificar si la cuenta está bloqueada por intentos fallidos
    const now = new Date();
    if (teacher.pinLockedUntil && teacher.pinLockedUntil > now) {
      // 403 → cuenta bloqueada
      throw new ForbiddenException('PIN_LOCKED');
    }

    // 3. Validar PIN
    if (!teacher.pinHash) {
      throw new UnauthorizedException('PIN_NOT_SET');
    }

    const isValidPin = await bcrypt.compare(pin, teacher.pinHash);

    if (!isValidPin) {
      // Incrementar intentos fallidos
      teacher.pinFailedAttempts = (teacher.pinFailedAttempts ?? 0) + 1;

      // Bloquear cuenta si excede el límite
      if (teacher.pinFailedAttempts >= this.MAX_PIN_ATTEMPTS) {
        const lockUntil = new Date(now.getTime() + this.PIN_LOCK_MINUTES * 60_000);
        teacher.pinLockedUntil = lockUntil;
      }

      await this.teacherRepository.save(teacher);
      // 401 → PIN incorrecto
      throw new UnauthorizedException('INVALID_PIN');
    }

    // 4. Resetear intentos fallidos en caso de éxito
    teacher.pinFailedAttempts = 0;
    teacher.pinLockedUntil = null;
    await this.teacherRepository.save(teacher);

    // 5. Encontrar o crear User asociado al Teacher (por email)
    let user = await this.userService.findByEmail(teacher.email);

    if (!user) {
      // Crear User si no existe (para compatibilidad con el sistema de tokens)
      // El User se crea con el mismo email del Teacher
      user = await this.userService.create({
        email: teacher.email,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Password temporal
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        role: UserRole.TEACHER,
        institutionId: teacher.institutionId,
        status: UserStatus.ACTIVE,
      });
    }

    // Verificar que el usuario esté activo
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    // 6. Generar tokens
    const accessToken = await this.generateJWT(user);
    const refreshToken = await this.generateRefreshToken(user);

    // 7. Mapear información del profesor al DTO
    const teacherInfo: TeacherInfoDto = {
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      employeeCode: teacher.employeeCode,
      institutionId: teacher.institutionId,
    };

    return {
      accessToken,
      refreshToken,
      teacher: teacherInfo,
    };
  }

  /**
   * Genera un refresh token JWT y lo guarda en la base de datos
   */
  private async generateRefreshToken(user: User): Promise<string> {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'refresh-secret-key';

    const refreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: this.getUserRole(user),
      roleId: user.roleId,
      schoolId: user.institutionId || undefined,
    };

    const token = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiration,
    });

    // Calcular fecha de expiración
    const expiresAt = new Date();
    const days = refreshExpiration.includes('d')
      ? parseInt(refreshExpiration.replace('d', ''))
      : 7;
    expiresAt.setDate(expiresAt.getDate() + days);

    // Guardar refresh token en la base de datos
    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
      revoked: false,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return token;
  }
}
