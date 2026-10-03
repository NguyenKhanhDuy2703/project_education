import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { UsersService } from '../users/users.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('google.clientId'),
      clientSecret: configService.getOrThrow<string>('google.clientSecret'),
      callbackURL: configService.getOrThrow<string>('google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { id: googleId, displayName: name, emails, photos } = profile;
    const email = emails?.[0]?.value;
    const avatarUrl = photos?.[0]?.value;

    if (!email) {
      return done(new Error('Google account has no email'), false);
    }

    // Tìm user theo googleId trước, sau đó theo email
    let user = await this.usersService.findByGoogleId(googleId);

    if (!user) {
      // Thử tìm theo email (user đã đăng ký bằng tài khoản thường)
      const existingByEmail = await this.usersService.findByEmail(email);
      if (existingByEmail) {
        // Liên kết googleId vào tài khoản hiện có
        user = await this.usersService.update(existingByEmail.id, { googleId, avatarUrl });
      } else {
        // Tạo tài khoản mới qua Google (phone để trống — unique constraint cần xử lý)
        user = await this.usersService.create({
          name,
          email,
          googleId,
          avatarUrl,
          role: UserRole.user,
          phone: `google_${googleId}`, // placeholder cho unique constraint
        });
      }
    }

    done(null, user);
  }
}
