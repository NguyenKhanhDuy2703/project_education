/**
 * features.ts
 *
 * Global runtime feature flags for study-web Frontend.
 * Supports environment overrides (VITE_*) with safe production defaults.
 */

export interface AppFeatureFlags {
  AUTOMATION_V3_ENABLED: boolean;
  SQL_WORKER_ENABLED: boolean;
  QUIZLET_ENABLED: boolean;
}

export const FEATURES: AppFeatureFlags = {
  AUTOMATION_V3_ENABLED:
    import.meta.env?.VITE_AUTOMATION_V3_ENABLED !== 'false' &&
    import.meta.env?.VITE_AUTOMATION_V3_ENABLED !== false,
  SQL_WORKER_ENABLED: true,
  QUIZLET_ENABLED: true,
};

const overrides: Partial<Record<keyof AppFeatureFlags, boolean>> = {};

export function setFeatureOverride(flag: keyof AppFeatureFlags, enabled: boolean): void {
  overrides[flag] = enabled;
}

export function resetFeatureOverrides(): void {
  Object.keys(overrides).forEach((k) => delete overrides[k as keyof AppFeatureFlags]);
}

export function isFeatureEnabled(flag: keyof AppFeatureFlags): boolean {
  if (flag in overrides) {
    return Boolean(overrides[flag]);
  }
  return Boolean(FEATURES[flag]);
}
