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
      // 1. Trích xuất token từ Cookie HOẶC từ Header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.accessToken;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      // 2. Không bỏ qua token hết hạn (hết hạn sẽ tự động bắn 401 Unauthorized)
      ignoreExpiration: false,
      // 3. Secret key dùng để giải mã và kiểm tra chữ ký — bắt buộc từ env
      secretOrKey: configService.get<string>('jwt.secret') ?? configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const userId = payload.sub || payload.payload?.userId || payload.userId;

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account has been deactivated');
    }

    // Trả về thông tin gắn vào req.user
    return {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}
