import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RateLimitGuard } from '../src/common/guards/rate-limit.guard';
import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/modules/auth/auth.service';

describe('PB-19 / PB-03 Session Security and Rate Limiting Suite', () => {
  it('RateLimitGuard blocks requests exceeding threshold with 429 Too Many Requests', () => {
    const mockReflector: any = {
      get: () => ({ limit: 3, ttlMs: 10000 }),
    };

    const guard = new RateLimitGuard(mockReflector);

    const makeContext = (ip: string) => ({
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          url: '/api/v1/auth/login',
          route: { path: '/api/v1/auth/login' },
          headers: { 'x-forwarded-for': ip },
        }),
      }),
      getHandler: () => ({}),
    });

    const ctx = makeContext('192.168.1.100');

    // Requests 1, 2, 3 must pass
    assert.equal(guard.canActivate(ctx as any), true);
    assert.equal(guard.canActivate(ctx as any), true);
    assert.equal(guard.canActivate(ctx as any), true);

    // Request 4 must be blocked with 429
    assert.throws(
      () => guard.canActivate(ctx as any),
      (err: any) => {
        return (
          err instanceof HttpException &&
          err.getStatus() === HttpStatus.TOO_MANY_REQUESTS
        );
      },
      'Request exceeding limit must throw 429 Too Many Requests',
    );

    // Different IP must not be blocked
    const ctxOther = makeContext('192.168.1.200');
    assert.equal(guard.canActivate(ctxOther as any), true);
  });

  it('AuthService.refreshToken strictly rejects revoked or replayed tokens without fallback', async () => {
    const mockUsersService: any = {
      findById: async () => ({ id: 'u1', isActive: true }),
      findByRefreshToken: async () => {
        throw new Error('Fallback should NEVER be reached!');
      },
    };

    const mockJwtService: any = {
      verifyAsync: async () => ({ type: 'REFRESH_TOKEN', userId: 'u1' }),
      signAsync: async () => 'mock-jwt-token',
    };

    const mockConfigService: any = {
      get: () => '15m',
    };

    const mockAuthSessionService: any = {
      validateAndRotate: async () => {
        throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
      },
    };

    const authService = new AuthService(
      mockUsersService,
      mockJwtService,
      {} as any,
      mockConfigService,
      mockAuthSessionService,
      {} as any,
    );

    await assert.rejects(
      async () => {
        await authService.refreshToken('some-revoked-token');
      },
      (err: any) => {
        return (
          err instanceof UnauthorizedException &&
          err.message.includes('Phiên đăng nhập không hợp lệ hoặc đã hết hạn')
        );
      },
      'Revoked token must be rejected without calling fallback',
    );
  });

  it('AuthService.changePassword revokes all user sessions and eliminates plaintext tokens', async () => {
    let sessionsRevoked = false;
    let passwordUpdated = false;

    const mockUsersService: any = {
      findById: async () => ({ id: 'u1', password: 'hashed-old-password' }),
      update: async () => {
        passwordUpdated = true;
      },
      updateRefreshToken: async () => {},
    };

    const mockBcrypt: any = {
      comparePassword: async () => true,
      hashPassword: async () => 'hashed-new-password',
    };

    const mockAuthSessionService: any = {
      revokeAllUserSessions: async (userId: string) => {
        if (userId === 'u1') sessionsRevoked = true;
      },
    };

    const authService = new AuthService(
      mockUsersService,
      {} as any,
      mockBcrypt,
      {} as any,
      mockAuthSessionService,
      {} as any,
    );

    const res = await authService.changePassword('u1', {
      currentPassword: 'old-pwd',
      newPassword: 'new-secure-password',
    });

    assert.equal(res.message, 'Đổi mật khẩu thành công');
    assert.equal(passwordUpdated, true, 'New password must be persisted');
    assert.equal(sessionsRevoked, true, 'All sessions must be revoked');
  });

  it('PB-01: AuthService.register returns nextAction: login and rejects duplicate email/phone with 409 Conflict', async () => {
    const mockUsersService: any = {
      findByEmail: async (email: string) => {
        if (email === 'duplicate@test.com') return { id: 'u-existing' };
        return null;
      },
      findByPhone: async (phone: string) => {
        if (phone === '0901234567') return { id: 'u-existing' };
        return null;
      },
      create: async (data: any) => ({
        id: 'new-user-id',
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'user',
      }),
    };

    const mockBcrypt: any = {
      hashPassword: async () => 'hashed-password',
    };

    const authService = new AuthService(
      mockUsersService,
      {} as any,
      mockBcrypt,
      {} as any,
      {} as any,
      {} as any,
    );

    // 1. Successful register
    const res = await authService.register({
      name: 'New Learner',
      email: 'new@test.com',
      phone: '0987654321',
      password: 'SecurePassword123!',
    });

    assert.equal(res.nextAction, 'login', 'Contract D-01: nextAction must be login');
    assert.equal(res.user.email, 'new@test.com');
    assert.equal((res as any).accessToken, undefined, 'Must not return accessToken on register');

    // 2. Duplicate email -> 409 ConflictException
    await assert.rejects(
      async () =>
        authService.register({
          name: 'Dupe Email',
          email: 'duplicate@test.com',
          phone: '0911111111',
          password: 'Password123!',
        }),
      (err: any) => err.status === 409,
      'Duplicate email must throw 409 ConflictException',
    );

    // 3. Duplicate phone -> 409 ConflictException
    await assert.rejects(
      async () =>
        authService.register({
          name: 'Dupe Phone',
          email: 'unique@test.com',
          phone: '0901234567',
          password: 'Password123!',
        }),
      (err: any) => err.status === 409,
      'Duplicate phone must throw 409 ConflictException',
    );
  });
});
