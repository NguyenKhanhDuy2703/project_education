import { describe, it, expect } from 'vitest';
import { RefreshCoordinator } from '@/features/auth/services/refreshCoordinator';

describe('RefreshCoordinator Single-Flight Suite (Subtask 1B.1)', () => {
  it('deduplicates 5 concurrent refresh requests into exactly 1 network call', async () => {
    let networkCallCount = 0;
    const coordinator = new RefreshCoordinator();

    // Mock asynchronous refresh network flight
    const mockRefreshCall = async (): Promise<string> => {
      networkCallCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return 'new_access_token_xyz';
    };

    // Simulate 5 concurrent 401 triggers
    const results = await Promise.all([
      coordinator.requestRefresh(mockRefreshCall),
      coordinator.requestRefresh(mockRefreshCall),
      coordinator.requestRefresh(mockRefreshCall),
      coordinator.requestRefresh(mockRefreshCall),
      coordinator.requestRefresh(mockRefreshCall),
    ]);

    // All 5 callers must receive the exact same new token
    expect(results).toEqual([
      'new_access_token_xyz',
      'new_access_token_xyz',
      'new_access_token_xyz',
      'new_access_token_xyz',
      'new_access_token_xyz',
    ]);

    // Crucial requirement: Exactly 1 network call was made
    expect(networkCallCount).toBe(1);
    expect(coordinator.isRefreshing()).toBe(false);
  });

  it('triggers onSessionExpired only on 401/403 rejection, not on network drop', async () => {
    let sessionExpiredCalled = false;
    const coordinator = new RefreshCoordinator({
      onSessionExpired: () => {
        sessionExpiredCalled = true;
      },
    });

    // 1. Network drop (e.g., fetch failed / no response)
    const networkError = new Error('Network error (offline)');
    await expect(coordinator.requestRefresh(() => Promise.reject(networkError))).rejects.toThrow();
    expect(sessionExpiredCalled).toBe(false);

    // 2. Auth rejection (401 from server)
    const authError = { response: { status: 401 } };
    await expect(coordinator.requestRefresh(() => Promise.reject(authError))).rejects.toBeDefined();
    expect(sessionExpiredCalled).toBe(true);
  });
});
