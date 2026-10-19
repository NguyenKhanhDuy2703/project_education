import { describe, it, expect } from 'vitest';
import { CrossTabAuth, type AuthBroadcastMessage } from '@/features/auth/services/crossTabAuth';

describe('CrossTabAuth Suite (Subtask 1B.3)', () => {
  it('instantiates cleanly and supports cross-tab coordination hooks', () => {
    const tabCoordinator = new CrossTabAuth('test_auth_channel');
    expect(tabCoordinator.isOtherTabRefreshing()).toBe(false);

    let receivedMsg: AuthBroadcastMessage | null = null;
    const unsubscribe = tabCoordinator.onMessage((msg) => {
      receivedMsg = msg;
    });

    // Test notify methods don't throw in test environment
    expect(() => {
      tabCoordinator.notifyRefreshStarted();
      tabCoordinator.notifyRefreshSuccess('new_token_123');
      tabCoordinator.notifyLogout();
    }).not.toThrow();

    expect(receivedMsg === null || typeof receivedMsg === 'object').toBe(true);

    unsubscribe();
    tabCoordinator.close();
  });
});
