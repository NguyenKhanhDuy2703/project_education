import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest: do not throw 401 if token is missing or invalid; return null or authenticated user
  handleRequest<TUser = any>(_err: any, user: any): TUser {
    return user || null;
  }
}
