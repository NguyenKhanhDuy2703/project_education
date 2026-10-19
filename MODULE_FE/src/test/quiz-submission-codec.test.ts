import { describe, it, expect } from 'vitest';
import {
  encodeQuizSubmission,
  decodeQuizSubmission,
  type QuizSubmissionDataV1,
} from '../features/lab/quiz/quizSubmissionCodec';

describe('Quiz Submission Codec (Subtask 6.6)', () => {
  it('encodes and decodes quiz submission data cleanly (round-trip)', () => {
    const payload: QuizSubmissionDataV1 = {
      version: '1.0',
      scorePercentage: 80,
      correctCount: 4,
      totalQuestions: 5,
      answers: { q1: 0, q2: 2, q3: 1, q4: 3, q5: 0 },
      submittedAt: '2026-10-17T12:00:00.000Z',
    };

    const encoded = encodeQuizSubmission(payload);
    expect(typeof encoded).toBe('string');

    const decoded = decodeQuizSubmission(encoded);
    expect(decoded).toEqual(payload);
  });

  it('gracefully handles malformed or non-JSON input without throwing', () => {
    expect(decodeQuizSubmission('')).toBeNull();
    expect(decodeQuizSubmission(null)).toBeNull();
    expect(decodeQuizSubmission(undefined)).toBeNull();
    expect(decodeQuizSubmission('SELECT * FROM users;')).toBeNull();
    expect(decodeQuizSubmission('{ invalid json }')).toBeNull();
    expect(decodeQuizSubmission('{"random": "object"}')).toBeNull();
  });
});
