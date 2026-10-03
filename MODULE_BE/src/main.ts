import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Kích hoạt parse Cookie
  app.use(cookieParser());

  // 2. Tiền tố API
  const apiPrefix = configService.get<string>('app.prefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // 3. CORS cho phép Cookie
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL') || 'http://localhost:5173',
    credentials: true,
  });

  // 4. Validation tự động DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 5. Swagger Documentation
  const swaggerConfig = configService.get('swagger');
  if (swaggerConfig?.enabled) {
    const documentBuilder = new DocumentBuilder()
      .setTitle(swaggerConfig.title || 'Study Web API')
      .setDescription(swaggerConfig.description || 'Authentication & Authorization API')
      .setVersion(swaggerConfig.version || '1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, documentBuilder);
    const swaggerPath = swaggerConfig.prefix || 'api/docs';
    SwaggerModule.setup(swaggerPath, app, document);
  }

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 Server running on: http://localhost:${port}/${apiPrefix}`);
  if (swaggerConfig?.enabled) {
    console.log(`📚 Swagger documentation at: http://localhost:${port}/${swaggerConfig.prefix || 'api/docs'}`);
  }
}

bootstrap();
