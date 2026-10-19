/**
 * CrossTabAuth Coordinator (Task 1B.3)
 * Coordinates authentication state and token refreshes across multiple browser tabs
 * via BroadcastChannel, preventing multi-tab race conditions and false logouts.
 */

export type AuthBroadcastMessage =
  | { type: 'REFRESH_STARTED' }
  | { type: 'REFRESH_SUCCESS'; accessToken: string }
  | { type: 'REFRESH_FAILED'; reason?: string }
  | { type: 'SESSION_LOGOUT' };

export class CrossTabAuth {
  private channel: BroadcastChannel | null = null;
  private isRefreshingRemote = false;

  constructor(channelName = 'study_auth_broadcast') {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(channelName);
      } catch {
        this.channel = null;
      }
    }
  }

  /**
   * Broadcasts that this tab has initiated a token refresh.
   */
  notifyRefreshStarted(): void {
    this.postMessage({ type: 'REFRESH_STARTED' });
  }

  /**
   * Broadcasts that refresh succeeded with a new access token.
   */
  notifyRefreshSuccess(accessToken: string): void {
    this.isRefreshingRemote = false;
    this.postMessage({ type: 'REFRESH_SUCCESS', accessToken });
  }

  /**
   * Broadcasts that refresh failed (credentials invalid).
   */
  notifyRefreshFailed(reason?: string): void {
    this.isRefreshingRemote = false;
    this.postMessage({ type: 'REFRESH_FAILED', reason });
  }

  /**
   * Broadcasts logout across all open tabs.
   */
  notifyLogout(): void {
    this.postMessage({ type: 'SESSION_LOGOUT' });
  }

  /**
   * Returns true if another tab is currently performing a token refresh.
   */
  isOtherTabRefreshing(): boolean {
    return this.isRefreshingRemote;
  }

  /**
   * Subscribes to events from other tabs.
   */
  onMessage(callback: (message: AuthBroadcastMessage) => void): () => void {
    if (!this.channel) return () => {};

    const handler = (event: MessageEvent<AuthBroadcastMessage>) => {
      if (event.data?.type === 'REFRESH_STARTED') {
        this.isRefreshingRemote = true;
      } else if (event.data?.type === 'REFRESH_SUCCESS' || event.data?.type === 'REFRESH_FAILED') {
        this.isRefreshingRemote = false;
      }
      callback(event.data);
    };

    this.channel.addEventListener('message', handler);
    return () => {
      this.channel?.removeEventListener('message', handler);
    };
  }

  private postMessage(message: AuthBroadcastMessage): void {
    try {
      this.channel?.postMessage(message);
    } catch {
      // Safe no-op if channel is closed or unsupported
    }
  }

  close(): void {
    this.channel?.close();
    this.channel = null;
  }
}

export const crossTabAuth = new CrossTabAuth();
