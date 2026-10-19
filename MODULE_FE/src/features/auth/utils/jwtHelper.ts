/**
 * JWT Helper utilities (Task 1B.4)
 * Parses payload without external dependencies and extracts expiry timestamps.
 */

export interface JwtPayload {
  exp?: number;
  iat?: number;
  userId?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Returns the milliseconds remaining until the JWT expires.
 * Returns 0 if already expired or invalid.
 */
export function getJwtTimeRemainingMs(token: string): number {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return 0;
  const expiryTimeMs = payload.exp * 1000;
  const remaining = expiryTimeMs - Date.now();
  return remaining > 0 ? remaining : 0;
}
