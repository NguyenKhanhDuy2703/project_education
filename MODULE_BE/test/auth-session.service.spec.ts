import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuthSessionService } from '../src/modules/auth/auth-session.service';

describe('AuthSessionService', () => {
  it('stores the legacy token and hashed session in one transaction', async () => {
    const writes: Array<{ model: string; args: unknown }> = [];
    let transactionCalls = 0;

    const transactionClient = {
      user: {
        update: async (args: unknown) => {
          writes.push({ model: 'user', args });
          return { id: 'user-1' };
        },
      },
      authSession: {
        create: async (args: unknown) => {
          writes.push({ model: 'authSession', args });
          return { id: 'session-1' };
        },
      },
    };

    const prisma = {
      $transaction: async (callback: (tx: typeof transactionClient) => Promise<unknown>) => {
        transactionCalls += 1;
        return callback(transactionClient);
      },
    };

    const service = new AuthSessionService(prisma as never);
    const result = await service.createSessionWithLegacyToken(
      'user-1',
      ' refresh-token ',
      { userAgent: 'test-agent', ipAddress: '127.0.0.1' },
    );

    assert.deepEqual(result, { id: 'session-1' });
    assert.equal(transactionCalls, 1);
    assert.equal(writes.length, 2);
    assert.deepEqual(writes[0], {
      model: 'user',
      args: {
        where: { id: 'user-1' },
        data: { refreshToken: ' refresh-token ' },
      },
    });

    const sessionWrite = writes[1] as {
      model: string;
      args: { data: Record<string, unknown> };
    };
    assert.equal(sessionWrite.model, 'authSession');
    assert.equal(sessionWrite.args.data.userId, 'user-1');
    assert.equal(sessionWrite.args.data.userAgent, 'test-agent');
    assert.equal(sessionWrite.args.data.ipAddress, '127.0.0.1');
    assert.equal(
      sessionWrite.args.data.refreshTokenHash,
      service.hashToken('refresh-token'),
    );
    assert.ok(sessionWrite.args.data.expiresAt instanceof Date);
  });
});
