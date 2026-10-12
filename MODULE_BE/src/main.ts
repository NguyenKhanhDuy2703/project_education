import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Kích hoạt parse Cookie
  app.use(cookieParser());

  // 2. Tiền tố API
  const apiPrefix = configService.get<string>('app.prefix');
  app.setGlobalPrefix(apiPrefix);

  // 3. CORS cho phép Cookie
  const rawOrigins =
    configService.get<string>('CORS_ORIGIN') ||
    configService.get<string>('CORS_ORIGINS') ||
    configService.get<string>('FRONTEND_URL') ||
    '';

  const configuredOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://project-education-red.vercel.app',
    ...configuredOrigins,
  ];

  const isWildcard = configuredOrigins.includes('*');

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // If '*' is configured, allow any origin
      if (isWildcard) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        defaultOrigins.includes(cleanOrigin) ||
        /^https:\/\/project-education-.*\.vercel\.app$/.test(cleanOrigin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
    ],
  });

  // 4. Validation tự động DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 5. Global Exception Logging Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // 6. Swagger Documentation
  const swaggerConfig = configService.get('swagger');
  if (swaggerConfig?.enabled) {
    const documentBuilder = new DocumentBuilder()
      .setTitle(swaggerConfig.title)
      .setDescription(swaggerConfig.description)
      .setVersion(swaggerConfig.version)
      .addBearerAuth()
      .addCookieAuth('accessToken')
      .build();
    const document = SwaggerModule.createDocument(app, documentBuilder);
    SwaggerModule.setup(swaggerConfig.prefix, app, document);
  }

  const port = configService.get<number>('app.port');
  await app.listen(port);
  console.log(`🚀 Server running on: http://localhost:${port}/${apiPrefix}`);
  if (swaggerConfig?.enabled) {
    console.log(
      `📚 Swagger documentation at: http://localhost:${port}/${swaggerConfig.prefix}`,
    );
  }
}

bootstrap();
