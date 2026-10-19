/**
 * LabContentCodec (Backend counterpart for Task 2.2)
 * Normalizes and serializes versioned envelopes and legacy database fields.
 */

export function normalizeLabObjective(objective: string | null | undefined): Record<string, any> {
  if (!objective || typeof objective !== 'string') return {};
  const trimmed = objective.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return {};
    }
  }
  return { legacyTextObjective: objective };
}

export function serializeLabObjective(config: Record<string, any>, sandboxType: string): string {
  const version = config?.version || '1.0';
  return JSON.stringify({
    _envelopeVersion: version,
    sandboxType,
    config,
  });
}
