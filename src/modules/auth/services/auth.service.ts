import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/services/user.service';
import { RegisterDto } from '../../user/dto/register.dto';
import { LoginDto } from '../../user/dto/login.dto';
import { User } from '../../user/entities/user.entity';
import { UserStatus } from '../../user/enums/user-status.enum';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
  roleId?: string;
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
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
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
   */
  async generateJWT(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: this.getUserRole(user),
      roleId: user.roleId,
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
}
