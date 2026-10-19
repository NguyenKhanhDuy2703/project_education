import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { BcryptService } from '../../utils/bcrypt.util';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthSessionService, JwtStrategy, GoogleStrategy, BcryptService],
  exports: [AuthService, AuthSessionService, PassportModule],
})
export class AuthModule {}
