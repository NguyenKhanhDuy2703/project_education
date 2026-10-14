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

    try {
      // Look up user by googleId first, fallback to email
      let user = await this.usersService.findByGoogleId(googleId);

      if (!user) {
        // Check if user already registered with this email via local credentials
        const existingByEmail = await this.usersService.findByEmail(email);
        const isSuperadmin = email.toLowerCase() === 'nguyenkhanhduy270304@gmail.com';
        if (existingByEmail) {
          // Link googleId to the existing user account
          user = await this.usersService.update(existingByEmail.id, {
            googleId,
            avatarUrl,
            ...(isSuperadmin ? { role: UserRole.admin } : {}),
          });
        } else {
          // Create new user account via Google OAuth
          user = await this.usersService.create({
            name,
            email,
            googleId,
            avatarUrl,
            role: isSuperadmin ? UserRole.admin : UserRole.user,
            phone: `google_${googleId}`, // Placeholder to satisfy unique phone constraint
          });
        }
      } else if (email.toLowerCase() === 'nguyenkhanhduy270304@gmail.com' && user.role !== UserRole.admin) {
        user = await this.usersService.update(user.id, { role: UserRole.admin });
      }

      done(null, user);
    } catch (err) {
      console.error('[GoogleStrategy] OAuth validation error:', err);
      done(err as Error, false);
    }
  }
}
