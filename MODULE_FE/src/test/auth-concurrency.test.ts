import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefreshCoordinator } from '../features/auth/services/refreshCoordinator';
import { CrossTabAuth } from '../features/auth/services/crossTabAuth';

describe('Subtask 8.2: Auth Concurrency & Multi-Tab Resilience Test', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('guarantees that 2 tabs attempting simultaneous refresh execute exactly 1 network flight', async () => {
    let networkRequestCount = 0;
    const mockServerRefresh = vi.fn().mockImplementation(async () => {
      networkRequestCount++;
      await new Promise((r) => setTimeout(r, 30));
      return 'shared_access_token_token_123';
    });

    const coordinator = new RefreshCoordinator();

    // Tab A and Tab B trigger refresh concurrently
    const [tabAResult, tabBResult] = await Promise.all([
      coordinator.requestRefresh(mockServerRefresh),
      coordinator.requestRefresh(mockServerRefresh),
    ]);

    expect(networkRequestCount).toBe(1);
    expect(tabAResult).toBe('shared_access_token_token_123');
    expect(tabBResult).toBe('shared_access_token_token_123');
    expect(coordinator.isRefreshing()).toBe(false);
  });

  it('broadcasts token refresh event across tabs using BroadcastChannel', async () => {
    const tabA = new CrossTabAuth();
    const tabB = new CrossTabAuth();

    let tabBReceivedToken = '';
    const unsub = tabB.onMessage((msg) => {
      if (msg.type === 'REFRESH_SUCCESS') {
        tabBReceivedToken = msg.accessToken;
      }
    });

    // Tab A successfully refreshes token and broadcasts
    tabA.notifyRefreshSuccess('new_token_broadcast_456');

    // Wait for message dispatch event loop tick
    await new Promise((r) => setTimeout(r, 20));

    expect(tabBReceivedToken).toBe('new_token_broadcast_456');

    unsub();
    tabA.close();
    tabB.close();
  });

  it('propagates logout across tabs, causing secondary tabs to clear active state', async () => {
    const tabA = new CrossTabAuth();
    const tabB = new CrossTabAuth();

    let tabBLoggedOut = false;
    const unsub = tabB.onMessage((msg) => {
      if (msg.type === 'SESSION_LOGOUT') {
        tabBLoggedOut = true;
      }
    });

    // Tab A logs out
    tabA.notifyLogout();

    // Wait for message dispatch event loop tick
    await new Promise((r) => setTimeout(r, 20));

    expect(tabBLoggedOut).toBe(true);

    unsub();
    tabA.close();
    tabB.close();
  });

  it('triggers onSessionExpired callback when backend rejects credentials with 401', async () => {
    let sessionExpiredCalled = false;
    const coordinator = new RefreshCoordinator({
      onSessionExpired: () => {
        sessionExpiredCalled = true;
      },
    });

    const failingServerRefresh = vi.fn().mockImplementation(async () => {
      const err: any = new Error('Unauthorized');
      err.status = 401;
      throw err;
    });

    await expect(coordinator.requestRefresh(failingServerRefresh)).rejects.toThrow('Unauthorized');
    expect(sessionExpiredCalled).toBe(true);
    expect(coordinator.isRefreshing()).toBe(false);
  });

  it('does NOT trigger onSessionExpired on transient network errors (e.g. offline 503 or Network Error)', async () => {
    let sessionExpiredCalled = false;
    const coordinator = new RefreshCoordinator({
      onSessionExpired: () => {
        sessionExpiredCalled = true;
      },
    });

    const networkErrorRefresh = vi.fn().mockImplementation(async () => {
      const err: any = new Error('Network error');
      err.status = 503;
      throw err;
    });

    await expect(coordinator.requestRefresh(networkErrorRefresh)).rejects.toThrow('Network error');
    expect(sessionExpiredCalled).toBe(false);
    expect(coordinator.isRefreshing()).toBe(false);
  });
});
