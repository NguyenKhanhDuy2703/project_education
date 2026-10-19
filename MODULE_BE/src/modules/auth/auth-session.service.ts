import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthSessionService {
  constructor(private readonly prisma: PrismaService) {}

  private buildSessionData(
    userId: string,
    refreshToken: string,
    metadata?: { userAgent?: string; ipAddress?: string },
  ) {
    return {
      userId,
      refreshTokenHash: this.hashToken(refreshToken),
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Hashes a raw refresh token using SHA-256 before database lookup/storage.
   * Prevents raw token exposure in database logs or unauthorized DB access.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  /**
   * Creates a new AuthSession record for a given user.
   */
  async createSession(
    userId: string,
    refreshToken: string,
    metadata?: { userAgent?: string; ipAddress?: string },
  ) {
    return this.prisma.authSession.create({
      data: this.buildSessionData(userId, refreshToken, metadata),
    });
  }

  /**
   * Creates a session and updates the temporary legacy token field atomically.
   * The legacy field can be removed after all clients use AuthSession rotation.
   */
  async createSessionWithLegacyToken(
    userId: string,
    refreshToken: string,
    metadata?: { userAgent?: string; ipAddress?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { refreshToken },
      });

      return tx.authSession.create({
        data: this.buildSessionData(userId, refreshToken, metadata),
      });
    });
  }

  /**
   * Validates a presented refresh token against active sessions.
   * Supports 30-second Grace Window for idempotent rotation during concurrent multi-tab requests.
   */
  async validateAndRotate(
    presentedToken: string,
    newRefreshToken: string,
  ): Promise<{ userId: string; sessionId: string; isGraceWindow: boolean }> {
    const presentedHash = this.hashToken(presentedToken);
    const now = new Date();

    // 1. Search for a session matching the current valid token hash
    let session = await this.prisma.authSession.findFirst({
      where: {
        refreshTokenHash: presentedHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });

    if (session) {
      // Normal rotation: Rotate current hash to previous hash with a 30s grace window
      const newHash = this.hashToken(newRefreshToken);
      const previousTokenExpiresAt = new Date(Date.now() + 30 * 1000); // 30s window

      await this.prisma.$transaction([
        this.prisma.authSession.update({
          where: { id: session.id },
          data: {
            previousTokenHash: session.refreshTokenHash,
            previousTokenExpiresAt,
            refreshTokenHash: newHash,
            updatedAt: now,
          },
        }),
        this.prisma.user.update({
          where: { id: session.userId },
          data: { refreshToken: newRefreshToken },
        }),
      ]);

      return { userId: session.userId, sessionId: session.id, isGraceWindow: false };
    }

    // 2. Check if this is a concurrent request using the previous token within the 30s grace window
    const graceSession = await this.prisma.authSession.findFirst({
      where: {
        previousTokenHash: presentedHash,
        previousTokenExpiresAt: { gt: now },
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });

    if (graceSession) {
      // Idempotent recovery during grace window
      return { userId: graceSession.userId, sessionId: graceSession.id, isGraceWindow: true };
    }

    throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
  }

  /**
   * Revokes a specific session (Logout).
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revokes all active sessions for a user (e.g. password change).
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
