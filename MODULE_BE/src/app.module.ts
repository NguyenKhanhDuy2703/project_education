import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import jwtConfig from './configs/jwt.config';
import appConfig from './configs/app.config';
import databaseConfig from './configs/database.config';
import swaggerConfig from './configs/swagger.config';

import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import validateEnvironmentVariables  from "./configs/env.validation"
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironmentVariables,
      load: [jwtConfig, appConfig, databaseConfig, swaggerConfig],
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jwt = config.get('jwt');
        return {
          secret: jwt?.secret || process.env.JWT_SECRET,
          signOptions: {
            expiresIn: jwt?.expiresIn || '7d',
          },
        };
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
