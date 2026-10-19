import { describe, it, expect } from 'vitest';
import { parseJwtPayload, getJwtTimeRemainingMs } from '@/features/auth/utils/jwtHelper';

describe('JwtHelper Suite (Subtask 1B.4)', () => {
  it('parses valid JWT payloads correctly', () => {
    // Header: {"alg":"HS256","typ":"JWT"}, Payload: {"userId":"u1","exp":2000000000}
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1MSIsImV4cCI6MjAwMDAwMDAwMH0.signature';
    const payload = parseJwtPayload(mockToken);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe('u1');
    expect(payload?.exp).toBe(2000000000);
  });

  it('calculates remaining milliseconds until expiry', () => {
    const futureExpSec = Math.floor(Date.now() / 1000) + 120; // 120 seconds in future
    const base64Payload = btoa(JSON.stringify({ exp: futureExpSec }));
    const mockToken = `header.${base64Payload}.sig`;

    const remainingMs = getJwtTimeRemainingMs(mockToken);
    expect(remainingMs).toBeGreaterThan(115 * 1000);
    expect(remainingMs).toBeLessThanOrEqual(120 * 1000);
  });

  it('returns 0 for expired or invalid tokens', () => {
    expect(getJwtTimeRemainingMs('invalid_token')).toBe(0);

    const pastExpSec = Math.floor(Date.now() / 1000) - 60; // 60s in past
    const base64Payload = btoa(JSON.stringify({ exp: pastExpSec }));
    const expiredToken = `header.${base64Payload}.sig`;
    expect(getJwtTimeRemainingMs(expiredToken)).toBe(0);
  });
});
