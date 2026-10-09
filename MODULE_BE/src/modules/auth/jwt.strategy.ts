import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // 1. Extract token from HttpOnly Cookie OR from Authorization: Bearer <token> Header
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.accessToken;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      // 2. Reject expired tokens (automatically emits 401 Unauthorized)
      ignoreExpiration: false,
      // 3. Secret key used for verification and decoding — read from env
      secretOrKey: configService.get<string>('jwt.secret') ?? configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // 1. Strict token type check: reject if not ACCESS_TOKEN
    if (payload.type !== 'ACCESS_TOKEN') {
      throw new UnauthorizedException('Invalid token type: expected ACCESS_TOKEN');
    }

    const userId = payload.sub || payload.payload?.userId || payload.userId;

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account has been deactivated');
    }

    // Attach sanitized user payload to req.user
    return {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}
