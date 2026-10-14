import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

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
    const rawPrefix = swaggerConfig.prefix || 'api/docs';
    const normalizedPrefix = rawPrefix.startsWith('/') ? rawPrefix : `/${rawPrefix}`;

    // Apply HTTP Basic Auth if user & password are configured in environment
    if (swaggerConfig.user && swaggerConfig.password) {
      app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.originalUrl.startsWith(normalizedPrefix)) {
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith('Basic ')) {
            res.setHeader('WWW-Authenticate', 'Basic realm="StudyIT API Documentation"');
            return res.status(401).send('Authentication required to access API documentation');
          }

          try {
            const b64Credentials = authHeader.split(' ')[1];
            const credentials = Buffer.from(b64Credentials, 'base64').toString('utf8');
            const [username, password] = credentials.split(':');

            const isUserValid = safeStringCompare(username || '', swaggerConfig.user);
            const isPasswordValid = safeStringCompare(password || '', swaggerConfig.password);

            if (!isUserValid || !isPasswordValid) {
              res.setHeader('WWW-Authenticate', 'Basic realm="StudyIT API Documentation"');
              return res.status(401).send('Invalid credentials');
            }
          } catch {
            res.setHeader('WWW-Authenticate', 'Basic realm="StudyIT API Documentation"');
            return res.status(401).send('Invalid authentication header');
          }
        }
        next();
      });
    }

    const documentBuilder = new DocumentBuilder()
      .setTitle(swaggerConfig.title)
      .setDescription(swaggerConfig.description)
      .setVersion(swaggerConfig.version)
      .addBearerAuth()
      .addCookieAuth('accessToken')
      .build();
    const document = SwaggerModule.createDocument(app, documentBuilder);
    SwaggerModule.setup(rawPrefix, app, document);
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

/**
 * Constant-time string comparison to prevent timing attack vulnerabilities.
 */
function safeStringCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
