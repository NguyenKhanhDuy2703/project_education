export interface StudioDraftData {
  title: string;
  markdown: string;
  sandboxType: string;
  isProOnly: boolean;
  durationMinutes: number;
  savedAt: string;
}

const STORAGE_PREFIX = 'study_lab_studio_draft_';

export function getStudioDraftStorageKey(seriesId?: string, labIdOrSlug?: string): string {
  const s = seriesId || 'general';
  const l = labIdOrSlug || 'new';
  return `${STORAGE_PREFIX}${s}_${l}`;
}

export function saveStudioDraft(key: string, data: StudioDraftData): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  try {
    const payload = JSON.stringify(data);
    localStorage.setItem(key, payload);
    return true;
  } catch (err: unknown) {
    // Handle QuotaExceededError or security block
    console.warn('Unable to save lab studio draft to localStorage:', err);
    return false;
  }
}

export function loadStudioDraft(key: string): StudioDraftData | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.markdown === 'string' &&
      typeof parsed.title === 'string'
    ) {
      return parsed as StudioDraftData;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearStudioDraft(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore cleanup error
  }
}
