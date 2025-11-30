import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/services/user.service';
import { JwtPayload } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    // Verify user still exists and is active
    const user = await this.userService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user data that will be attached to request.user
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
