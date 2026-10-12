import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = isHttpException
      ? exception.getResponse()
      : {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        };

    const rawIp =
      request.headers['x-forwarded-for'] ||
      request.socket.remoteAddress ||
      request.ip ||
      'unknown';
    const clientIp = Array.isArray(rawIp)
      ? rawIp[0]
      : String(rawIp).split(',')[0].trim();

    const method = request.method;
    const url = request.originalUrl || request.url;
    const errorMessage =
      typeof errorResponse === 'object' && errorResponse !== null
        ? JSON.stringify(errorResponse)
        : String(errorResponse);

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `[${method}] ${url} ${status} - Server Error: ${errorMessage} - IP: ${clientIp}`,
        stack,
      );
    } else {
      this.logger.warn(
        `[${method}] ${url} ${status} - Client Error: ${errorMessage} - IP: ${clientIp}`,
      );
    }

    if (typeof errorResponse === 'object' && errorResponse !== null) {
      response.status(status).json(errorResponse);
    } else {
      response.status(status).json({
        statusCode: status,
        message: errorResponse,
      });
    }
  }
}
