import type { QuizQuestionV1 } from '../../../types/lab.types';

export interface QuestionGradingDetail {
  questionId: string;
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
  isAnswered: boolean;
  explanation?: string;
}

export interface QuizGradingResult {
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  unansweredQuestionIds: string[];
  correctCount: number;
  scorePercentage: number;
  isPassed: boolean;
  details: QuestionGradingDetail[];
}

/**
 * Checks which questions have not been answered by the learner.
 */
export function getUnansweredQuestionIds(
  questions: QuizQuestionV1[],
  answers: Record<string, number>
): string[] {
  if (!Array.isArray(questions)) return [];
  return questions
    .filter((q) => answers[q.id] === undefined || answers[q.id] === null || answers[q.id] < 0)
    .map((q) => q.id);
}

/**
 * Pure function to grade a quiz given question list and student answers.
 * Does not mutate inputs, handles invalid configs gracefully.
 */
export function gradeQuiz(
  questions: QuizQuestionV1[],
  answers: Record<string, number>,
  passPercentage = 70
): QuizGradingResult {
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeAnswers = answers || {};

  if (safeQuestions.length === 0) {
    return {
      totalQuestions: 0,
      answeredCount: 0,
      unansweredCount: 0,
      unansweredQuestionIds: [],
      correctCount: 0,
      scorePercentage: 0,
      isPassed: false,
      details: [],
    };
  }

  const details: QuestionGradingDetail[] = [];
  let correctCount = 0;
  let answeredCount = 0;
  const unansweredQuestionIds: string[] = [];

  for (const q of safeQuestions) {
    const selected = safeAnswers[q.id];
    const isAnswered = selected !== undefined && selected !== null && selected >= 0;

    if (isAnswered) {
      answeredCount++;
    } else {
      unansweredQuestionIds.push(q.id);
    }

    const isCorrect = isAnswered && selected === q.correctIndex;
    if (isCorrect) {
      correctCount++;
    }

    details.push({
      questionId: q.id,
      selectedOptionIndex: isAnswered ? selected : null,
      correctOptionIndex: q.correctIndex,
      isCorrect,
      isAnswered,
      explanation: q.explanation,
    });
  }

  const scorePercentage = Math.round((correctCount / safeQuestions.length) * 100);
  const isPassed = scorePercentage >= passPercentage;

  return {
    totalQuestions: safeQuestions.length,
    answeredCount,
    unansweredCount: safeQuestions.length - answeredCount,
    unansweredQuestionIds,
    correctCount,
    scorePercentage,
    isPassed,
    details,
  };
}
