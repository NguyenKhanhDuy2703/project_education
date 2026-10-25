import { Injectable } from '@nestjs/common';

export interface QuizQuestionDef {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint?: string;
  explanation?: string;
}

export interface QuizGradingDetail {
  questionId: string;
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation?: string;
}

export interface ServerQuizGradingResult {
  status: 'passed' | 'failed';
  timeMs: number;
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  testLogs: string;
  review: {
    isPassed: boolean;
    scorePercentage: number;
    correctCount: number;
    totalQuestions: number;
    details: QuizGradingDetail[];
  };
}

export function extractQuizQuestionsFromObjective(objective: string | null): {
  questions: QuizQuestionDef[];
  passPercentage: number;
} {
  if (!objective) {
    return { questions: [], passPercentage: 70 };
  }

  try {
    const parsed = JSON.parse(objective);
    if (Array.isArray(parsed)) {
      return { questions: parsed, passPercentage: 70 };
    }
    const config =
      parsed?.config && typeof parsed.config === 'object'
        ? { ...parsed, ...parsed.config }
        : parsed;

    const questions =
      config.questions ||
      config.quizQuestions ||
      config.quizList ||
      [];
    const passPercentage =
      typeof config.passPercentage === 'number' ? config.passPercentage : 70;

    return {
      questions: Array.isArray(questions) ? questions : [],
      passPercentage,
    };
  } catch {
    return { questions: [], passPercentage: 70 };
  }
}

export function parseSubmittedAnswers(rawSubmittedCode: string | null | undefined): Record<string, number> {
  if (!rawSubmittedCode || typeof rawSubmittedCode !== 'string') return {};

  try {
    const parsed = JSON.parse(rawSubmittedCode.trim());
    if (!parsed || typeof parsed !== 'object') return {};

    // Standard QuizSubmissionDataV1 format: { answers: { [id]: number } }
    if (parsed.answers && typeof parsed.answers === 'object' && !Array.isArray(parsed.answers)) {
      return parsed.answers;
    }

    // Direct map format: { q1: 1, q2: 0 }
    if (!Array.isArray(parsed)) {
      const answers: Record<string, number> = {};
      for (const [key, val] of Object.entries(parsed)) {
        if (typeof val === 'number') {
          answers[key] = val;
        }
      }
      return answers;
    }

    // Array of indices: [1, 0, 2] -> map by index
    const answers: Record<string, number> = {};
    parsed.forEach((val, idx) => {
      if (typeof val === 'number') {
        answers[String(idx)] = val;
      }
    });
    return answers;
  } catch {
    return {};
  }
}

@Injectable()
export class QuizGradingService {
  grade(params: {
    submittedCode: string | null | undefined;
    objective: string | null;
  }): ServerQuizGradingResult {
    const { questions, passPercentage } = extractQuizQuestionsFromObjective(params.objective);
    const answers = parseSubmittedAnswers(params.submittedCode);

    if (questions.length === 0) {
      return {
        status: 'failed',
        timeMs: 50,
        scorePercentage: 0,
        correctCount: 0,
        totalQuestions: 0,
        testLogs: 'Quiz grading failed: No questions configured in lab.',
        review: {
          isPassed: false,
          scorePercentage: 0,
          correctCount: 0,
          totalQuestions: 0,
          details: [],
        },
      };
    }

    let correctCount = 0;
    const details: QuizGradingDetail[] = [];

    questions.forEach((q, idx) => {
      const qId = q.id || String(idx);
      const selected = answers[qId] ?? answers[String(idx)] ?? null;
      const isCorrect =
        selected !== null &&
        selected !== undefined &&
        selected === q.correctIndex;

      if (isCorrect) {
        correctCount++;
      }

      details.push({
        questionId: qId,
        selectedOptionIndex: selected,
        correctOptionIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      });
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    const isPassed = scorePercentage >= passPercentage;
    const status = isPassed ? 'passed' : 'failed';
    const testLogs = `Quiz graded: ${correctCount}/${questions.length} correct (${scorePercentage}%). Threshold: ${passPercentage}%.`;

    return {
      status,
      timeMs: 50,
      scorePercentage,
      correctCount,
      totalQuestions: questions.length,
      testLogs,
      review: {
        isPassed,
        scorePercentage,
        correctCount,
        totalQuestions: questions.length,
        details,
      },
    };
  }
}
