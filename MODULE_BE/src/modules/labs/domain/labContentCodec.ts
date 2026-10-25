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

export function sanitizeLabConfigForLearner(config: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!config || typeof config !== 'object') return config;
  const sanitized = { ...config };
  delete sanitized.gradingRules;
  delete sanitized.hiddenChecks;
  delete sanitized.acceptedAnswers;
  delete sanitized.acceptedAnswersOrRules;
  delete sanitized.expectedQueryResult;
  delete sanitized.verificationSql;
  delete sanitized.gradingKey;
  delete sanitized.solutionPlan;
  delete sanitized.serverGradingRules;
  return sanitized;
}

export type LearningUnitType = 'theory' | 'sql_practice' | 'quiz_checkpoint' | 'automation_lab';

export function inferLearningUnitType(
  rawUnitType?: string | null,
  sandboxType?: string | null,
): LearningUnitType {
  if (rawUnitType) {
    if (['theory', 'sql_practice', 'quiz_checkpoint', 'automation_lab'].includes(rawUnitType)) {
      return rawUnitType as LearningUnitType;
    }
  }

  if (sandboxType === 'markdown_only') {
    return 'theory';
  }
  if (sandboxType === 'sql_worker') {
    return 'sql_practice';
  }
  if (sandboxType === 'quizlet') {
    return 'quiz_checkpoint';
  }
  if (sandboxType === 'js_worker' || sandboxType === 'automation_v3') {
    return 'automation_lab';
  }
  return 'theory';
}
