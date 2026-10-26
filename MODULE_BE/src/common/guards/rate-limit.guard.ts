import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export interface RateLimitOptions {
  limit: number;
  ttlMs: number;
}

export const RATE_LIMIT_KEY = 'rate_limit';
export const Throttle = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

interface ClientRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly records = new Map<string, ClientRecord>();

  constructor(private readonly reflector: Reflector) {
    // Periodic cleanup of expired client records every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.records.entries()) {
        if (record.resetTime <= now) {
          this.records.delete(key);
        }
      }
    }, 5 * 60 * 1000).unref?.();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    const customOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      handler,
    );

    const limit = customOptions?.limit ?? 30; // 30 requests per window by default
    const ttlMs = customOptions?.ttlMs ?? 60 * 1000; // 1 minute window

    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.ip ||
      request.socket?.remoteAddress ||
      'anonymous';

    const key = `${request.method}:${request.route?.path || request.url}:${ip}`;
    const now = Date.now();

    const existing = this.records.get(key);

    if (!existing || existing.resetTime <= now) {
      this.records.set(key, { count: 1, resetTime: now + ttlMs });
      return true;
    }

    if (existing.count >= limit) {
      throw new HttpException(
        'Too many requests. Please slow down and try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    existing.count += 1;
    return true;
  }
}
