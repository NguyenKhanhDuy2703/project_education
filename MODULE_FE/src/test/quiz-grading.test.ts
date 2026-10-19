import { describe, it, expect } from 'vitest';
import { gradeQuiz, getUnansweredQuestionIds } from '../features/lab/quiz/quizGrading';
import type { QuizQuestionV1 } from '../types/lab.types';

describe('Quiz Grading Domain Suite (Subtask 6.1)', () => {
  const sampleQuestions: QuizQuestionV1[] = [
    {
      id: 'q1',
      question: 'What is PostgreSQL?',
      options: ['RDBMS', 'NoSQL', 'File System'],
      correctIndex: 0,
      explanation: 'PostgreSQL is an open-source relational DBMS.',
    },
    {
      id: 'q2',
      question: 'Which clause is used to filter grouped results?',
      options: ['WHERE', 'HAVING', 'GROUP BY'],
      correctIndex: 1,
      explanation: 'HAVING filters aggregated groups.',
    },
    {
      id: 'q3',
      question: 'What does CTE stand for?',
      options: ['Common Table Expression', 'Command Table Engine', 'Compact Text Encoding'],
      correctIndex: 0,
      explanation: 'CTE stands for Common Table Expression.',
    },
    {
      id: 'q4',
      question: 'Which keyword starts a CTE?',
      options: ['SELECT', 'WITH', 'DECLARE'],
      correctIndex: 1,
      explanation: 'WITH introduces a Common Table Expression.',
    },
  ];

  it('grades 100% when all answers are correct', () => {
    const answers = { q1: 0, q2: 1, q3: 0, q4: 1 };
    const result = gradeQuiz(sampleQuestions, answers, 70);

    expect(result.totalQuestions).toBe(4);
    expect(result.correctCount).toBe(4);
    expect(result.scorePercentage).toBe(100);
    expect(result.isPassed).toBe(true);
    expect(result.unansweredCount).toBe(0);
    expect(result.unansweredQuestionIds).toEqual([]);
    expect(result.details.every((d) => d.isCorrect)).toBe(true);
  });

  it('grades partially correct answers and computes pass/fail based on passPercentage', () => {
    // 2 out of 4 correct = 50%
    const answers = { q1: 0, q2: 0, q3: 0, q4: 0 }; // q1 correct (0), q2 wrong (0 vs 1), q3 correct (0), q4 wrong (0 vs 1)
    const resultFail = gradeQuiz(sampleQuestions, answers, 70);
    expect(resultFail.correctCount).toBe(2);
    expect(resultFail.scorePercentage).toBe(50);
    expect(resultFail.isPassed).toBe(false);

    // Pass threshold lowered to 50%
    const resultPass = gradeQuiz(sampleQuestions, answers, 50);
    expect(resultPass.isPassed).toBe(true);
  });

  it('detects unanswered questions accurately', () => {
    const answers = { q1: 0, q3: 0 }; // q2 and q4 unanswered
    const unanswered = getUnansweredQuestionIds(sampleQuestions, answers);
    expect(unanswered).toEqual(['q2', 'q4']);

    const result = gradeQuiz(sampleQuestions, answers);
    expect(result.answeredCount).toBe(2);
    expect(result.unansweredCount).toBe(2);
    expect(result.unansweredQuestionIds).toEqual(['q2', 'q4']);
    expect(result.details.find((d) => d.questionId === 'q2')?.isAnswered).toBe(false);
  });

  it('handles empty questions list and null/undefined inputs gracefully', () => {
    const emptyResult = gradeQuiz([], {});
    expect(emptyResult.totalQuestions).toBe(0);
    expect(emptyResult.isPassed).toBe(false);

    const nullResult = gradeQuiz(undefined as any, null as any);
    expect(nullResult.totalQuestions).toBe(0);
  });
});
