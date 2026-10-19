import { describe, it, expect } from 'vitest';
import { normalizeLabDetail } from '../features/lab/domain/labContentCodec';
import { gradeQuiz, getUnansweredQuestionIds } from '../features/lab/quiz/quizGrading';
import { encodeQuizSubmission, decodeQuizSubmission } from '../features/lab/quiz/quizSubmissionCodec';
import type { QuizLabConfig, QuizQuestionV1 } from '../types/lab.types';

describe('Subtask 8.5: Quiz Lab End-to-End Flow Test', () => {
  const sampleQuizLab = {
    id: 'lab-quiz-react-hooks',
    title: 'React Hooks Mastery Quiz',
    sandboxType: 'quizlet',
    instructions: '# React Hooks Quiz\n\nTest your understanding of useEffect, useMemo, and useCallback hooks.',
    quizQuestions: [
      {
        id: 'q1',
        question: 'When does the cleanup function in useEffect run?',
        options: [
          'Only when the component unmounts',
          'Before the next effect execution and on unmount',
          'Immediately after every render',
          'Never unless called manually',
        ],
        correctIndex: 1,
        explanation: 'The cleanup function runs before re-running the effect with new dependencies, as well as upon unmounting.',
      },
      {
        id: 'q2',
        question: 'What is the primary difference between useMemo and useCallback?',
        options: [
          'useMemo caches a computed value; useCallback caches a function definition',
          'useCallback caches a value; useMemo runs an effect',
          'There is no difference',
          'useMemo cannot take dependencies',
        ],
        correctIndex: 0,
        explanation: 'useCallback(fn, deps) is equivalent to useMemo(() => fn, deps).',
      },
      {
        id: 'q3',
        question: 'Can React Hook calls be nested inside conditional if statements?',
        options: [
          'Yes, if the condition does not change',
          'No, hooks must always be called at the top level of a component',
          'Yes, in React 19 only',
          'Only inside useEffect',
        ],
        correctIndex: 1,
        explanation: 'Rules of Hooks require calling hooks at the top level to guarantee identical call order across renders.',
      },
    ],
  };

  it('normalizes quiz lab into versioned envelope with question list', () => {
    const lab = normalizeLabDetail(sampleQuizLab as any);
    expect(lab.envelope.sandboxType).toBe('quizlet');
    const config = lab.envelope.config as QuizLabConfig;
    expect(config.questions).toHaveLength(3);
    expect(config.questions[0].question).toContain('cleanup function');
  });

  it('tracks answered vs unanswered questions for Question Palette navigation', () => {
    const questions = sampleQuizLab.quizQuestions as QuizQuestionV1[];
    
    // Initially, no answers
    const emptyAnswers: Record<string, number> = {};
    const unansweredInitial = getUnansweredQuestionIds(questions, emptyAnswers);
    expect(unansweredInitial).toEqual(['q1', 'q2', 'q3']);

    // Student answers q1 and q3, skips q2
    const partialAnswers: Record<string, number> = { q1: 1, q3: 1 };
    const unansweredPartial = getUnansweredQuestionIds(questions, partialAnswers);
    expect(unansweredPartial).toEqual(['q2']);
  });

  it('grades quiz and verifies pass threshold calculation', () => {
    const questions = sampleQuizLab.quizQuestions as QuizQuestionV1[];

    // Case 1: 1 of 3 correct (33.3%) -> fails at 70% threshold
    const failingAnswers = { q1: 1, q2: 1, q3: 0 };
    const failResult = gradeQuiz(questions, failingAnswers, 70);
    expect(failResult.correctCount).toBe(1);
    expect(failResult.totalQuestions).toBe(3);
    expect(failResult.scorePercentage).toBe(33);
    expect(failResult.isPassed).toBe(false);

    // Case 2: 3 of 3 correct (100%) -> passes
    const perfectAnswers = { q1: 1, q2: 0, q3: 1 };
    const passResult = gradeQuiz(questions, perfectAnswers, 70);
    expect(passResult.correctCount).toBe(3);
    expect(passResult.scorePercentage).toBe(100);
    expect(passResult.isPassed).toBe(true);

    // Verify explanation is populated in grading result details
    expect(passResult.details[0].explanation).toContain('cleanup function runs before');
    expect(passResult.details[0].isCorrect).toBe(true);
  });

  it('encodes and decodes quiz submission preserving answers and score with 100% round-trip fidelity', () => {
    const answers: Record<string, number> = { q1: 1, q2: 0, q3: 1 };
    const submissionData = {
      version: '1.0' as const,
      scorePercentage: 100,
      correctCount: 3,
      totalQuestions: 3,
      answers,
      submittedAt: new Date().toISOString(),
    };

    const encoded = encodeQuizSubmission(submissionData);
    expect(typeof encoded).toBe('string');

    const decoded = decodeQuizSubmission(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.version).toBe('1.0');
    expect(decoded?.scorePercentage).toBe(100);
    expect(decoded?.correctCount).toBe(3);
    expect(decoded?.answers).toEqual(answers);
  });
});
