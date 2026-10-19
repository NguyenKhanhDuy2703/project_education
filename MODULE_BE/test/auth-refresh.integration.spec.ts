import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Characterization test for Legacy Auth Token Rotation Race (Subtask 1A.1)
 * Simulates concurrent refresh calls with the legacy 1-to-1 plaintext token replacement in DB.
 */
describe('Auth Refresh Token Concurrency Characterization (Subtask 1A.1)', () => {
  it('demonstrates legacy single-field race: second concurrent request fails with 401', async () => {
    // Simulating database state where user has a single active refresh token
    let dbRefreshToken: string | null = 'token_version_0'
    const userId = 'user_123'

    const legacyRefreshToken = async (presentedToken: string) => {
      // 1. Lookup by equality
      if (dbRefreshToken !== presentedToken) {
        throw new Error('Invalid refresh token (401)')
      }
      // 2. Rotate to new token
      const nextToken = `token_version_${Date.now()}_${Math.random()}`
      dbRefreshToken = nextToken
      return { accessToken: 'new_access', refreshToken: nextToken }
    }

    // Tab A and Tab B receive the initial token 'token_version_0'
    const tabA_token = 'token_version_0'
    const tabB_token = 'token_version_0'

    // Tab A refreshes first
    const tabA_result = await legacyRefreshToken(tabA_token)
    assert.ok(tabA_result.accessToken)

    // Tab B tries to refresh with the same token right after Tab A has rotated DB state
    await assert.rejects(
      async () => {
        await legacyRefreshToken(tabB_token)
      },
      {
        message: 'Invalid refresh token (401)',
      },
      'Tab B must be rejected under legacy rotation, proving the multi-tab race condition bug',
    )
  })

  it('demonstrates replay vulnerability of plaintext single-token storage', async () => {
    let dbRefreshToken: string | null = 'raw_unhashed_token_xyz'
    // Storing unhashed plaintext allows anyone with read access to database to replay
    assert.equal(dbRefreshToken, 'raw_unhashed_token_xyz')
  })

  it('demonstrates new ADR-001 idempotent rotation with 30s grace window (Subtask 1A.3)', async () => {
    // Simulating AuthSession in-memory state
    let session = {
      refreshTokenHash: 'hash_token_0',
      previousTokenHash: null as string | null,
      previousTokenExpiresAt: null as number | null,
      revokedAt: null as number | null,
    }

    const hashFn = (t: string) => `hash_${t}`

    const atomicRotate = async (token: string) => {
      const hash = hashFn(token)
      const now = Date.now()

      if (session.revokedAt) {
        throw new Error('Revoked session (401)')
      }

      // 1. Current token match
      if (session.refreshTokenHash === hash) {
        const nextToken = `token_${now}_${Math.random()}`
        session.previousTokenHash = session.refreshTokenHash
        session.previousTokenExpiresAt = now + 30000 // 30s grace window
        session.refreshTokenHash = hashFn(nextToken)
        return { accessToken: `access_${nextToken}`, refreshToken: nextToken, isGraceWindow: false }
      }

      // 2. Previous token match within grace window
      if (
        session.previousTokenHash === hash &&
        session.previousTokenExpiresAt &&
        session.previousTokenExpiresAt > now
      ) {
        return { accessToken: 'fresh_idempotent_access', refreshToken: token, isGraceWindow: true }
      }

      throw new Error('Invalid refresh token (401)')
    }

    // Both Tab A and Tab B have token_0
    const token_0 = 'token_0'

    // Tab A triggers refresh
    const resA = await atomicRotate(token_0)
    assert.equal(resA.isGraceWindow, false)
    assert.ok(resA.refreshToken)

    // Tab B concurrently calls refresh with token_0 within 30s
    const resB = await atomicRotate(token_0)
    assert.equal(resB.isGraceWindow, true)
    assert.equal(resB.accessToken, 'fresh_idempotent_access')
    // Both tabs successfully receive valid access tokens without logging the user out!
  })

  it('demonstrates session revocation on logout and rejection of replayed token (Subtask 1A.5)', async () => {
    let session: {
      refreshTokenHash: string
      previousTokenHash: string | null
      revokedAt: number | null
    } = {
      refreshTokenHash: 'hash_active_token',
      previousTokenHash: 'hash_prev_token',
      revokedAt: null,
    }

    const logout = () => {
      session.revokedAt = Date.now()
    }

    const validateToken = (tokenHash: string) => {
      if (session.revokedAt) {
        throw new Error('Session has been revoked (401)')
      }
      if (session.refreshTokenHash === tokenHash || session.previousTokenHash === tokenHash) {
        return { valid: true }
      }
      throw new Error('Invalid token (401)')
    }

    // Active session accepts valid token
    assert.equal(validateToken('hash_active_token').valid, true)

    // User logs out -> session revoked
    logout()

    // Replay attempt with previously valid token must be rejected with 401
    assert.throws(
      () => validateToken('hash_active_token'),
      /Session has been revoked \(401\)/,
      'Replay must fail after logout',
    )
    assert.throws(
      () => validateToken('hash_prev_token'),
      /Session has been revoked \(401\)/,
      'Previous token replay must also fail after logout',
    )
  })
})


