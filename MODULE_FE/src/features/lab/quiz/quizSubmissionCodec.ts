export interface QuizSubmissionDataV1 {
  version: '1.0';
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  answers: Record<string, number>;
  submittedAt: string;
}

/**
 * Encodes quiz answers and score into versioned JSON string for storage in submittedCode.
 */
export function encodeQuizSubmission(data: QuizSubmissionDataV1): string {
  return JSON.stringify(data);
}

/**
 * Decodes submittedCode JSON string into QuizSubmissionDataV1.
 * Robust against malformed data, returns null if invalid.
 */
export function decodeQuizSubmission(raw: string | undefined | null): QuizSubmissionDataV1 | null {
  if (!raw || typeof raw !== 'string') return null;

  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.scorePercentage === 'number' &&
      typeof parsed.totalQuestions === 'number' &&
      parsed.answers &&
      typeof parsed.answers === 'object'
    ) {
      return {
        version: parsed.version || '1.0',
        scorePercentage: parsed.scorePercentage,
        correctCount: parsed.correctCount ?? 0,
        totalQuestions: parsed.totalQuestions,
        answers: parsed.answers,
        submittedAt: parsed.submittedAt || new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}
