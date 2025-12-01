import { Controller, Post, Body, Get, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../../user/dto/register.dto';
import { LoginDto } from '../../user/dto/login.dto';
import { QuickLoginDto } from '../dto/quick-login.dto';
import { QuickLoginResponseDto } from '../dto/quick-login-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account in the system',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          role: 'admin',
        },
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists' })
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate user and return JWT access token',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          role: 'admin',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Public()
  @Post('quick-login')
  @ApiOperation({
    summary: 'Quick login by employeeCode + PIN',
    description: 'Authenticate teacher using employee code and PIN. Returns JWT tokens and teacher information.',
  })
  @ApiBody({ type: QuickLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Quick login successful',
    type: QuickLoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid PIN' })
  @ApiResponse({ status: 403, description: 'Forbidden - Account locked due to failed PIN attempts' })
  @ApiResponse({ status: 404, description: 'Not Found - Teacher with employeeCode not found' })
  async quickLogin(@Body(ValidationPipe) dto: QuickLoginDto): Promise<QuickLoginResponseDto> {
    return await this.authService.quickLogin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve authenticated user information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        role: 'admin',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getProfile(@CurrentUser() user: CurrentUserData) {
    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };
  }
}
