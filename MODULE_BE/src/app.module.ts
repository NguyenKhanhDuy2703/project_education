import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import jwtConfig from './configs/jwt.config';
import appConfig from './configs/app.config';
import databaseConfig from './configs/database.config';
import swaggerConfig from './configs/swagger.config';
import googleConfig from './configs/google.config';

import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { SeriesModule } from './modules/series/series.module';
import { LabsModule } from './modules/labs/labs.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { EntitlementsModule } from './modules/entitlements/entitlements.module';
import { GroupsModule } from './modules/groups/groups.module';
import { ReviewModule } from './modules/review/review.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import validateEnvironmentVariables from './configs/env.validation';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironmentVariables,
      load: [jwtConfig, appConfig, databaseConfig, swaggerConfig, googleConfig],
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jwt = config.get('jwt');
        return {
          secret: jwt?.secret,
          signOptions: {
            expiresIn: jwt?.expiresIn ?? '7d',
          },
        };
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SeriesModule,
    LabsModule,
    AuditLogsModule,
    EntitlementsModule,
    GroupsModule,
    ReviewModule,
    FeedbackModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
