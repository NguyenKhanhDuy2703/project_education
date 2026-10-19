/**
 * RefreshCoordinator (Task 1B.1)
 * Manages single-flight access token refreshes, prevents duplicate network calls,
 * and distinguishes between network errors and credential rejection.
 */

export type RefreshFetcher = () => Promise<string>;

export class RefreshCoordinator {
  private activeRefreshPromise: Promise<string> | null = null;
  private onSessionExpiredCallback?: () => void;

  constructor(options?: { onSessionExpired?: () => void }) {
    this.onSessionExpiredCallback = options?.onSessionExpired;
  }

  /**
   * Returns true if a refresh network flight is currently in progress.
   */
  isRefreshing(): boolean {
    return this.activeRefreshPromise !== null;
  }

  /**
   * Executes a refresh request with single-flight deduplication.
   * If a refresh is already in progress, concurrent callers await the same in-flight promise.
   */
  async requestRefresh(fetcher: RefreshFetcher): Promise<string> {
    if (this.activeRefreshPromise) {
      return this.activeRefreshPromise;
    }

    this.activeRefreshPromise = (async () => {
      try {
        const newAccessToken = await fetcher();
        if (!newAccessToken) {
          throw new Error('No access token returned from refresh');
        }
        return newAccessToken;
      } catch (error: any) {
        // Distinguish authentication failure (401/403) from network/transient failures
        const isAuthRejection =
          error?.response?.status === 401 ||
          error?.response?.status === 403 ||
          error?.status === 401 ||
          error?.status === 403;

        if (isAuthRejection && this.onSessionExpiredCallback) {
          this.onSessionExpiredCallback();
        }
        throw error;
      } finally {
        this.activeRefreshPromise = null;
      }
    })();

    return this.activeRefreshPromise;
  }

  /**
   * Resets coordinator state (useful in testing or hard reset).
   */
  reset(): void {
    this.activeRefreshPromise = null;
  }
}

export const defaultRefreshCoordinator = new RefreshCoordinator();
