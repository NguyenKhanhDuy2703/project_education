import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizAssignmentWorkspace } from '../features/lab/strategies/QuizAssignmentWorkspace';
import { QuizQuestionCard } from '../features/lab/strategies/QuizQuestionCard';
import type { PracticeLabV1 } from '../types/lab.types';

describe('QuizAssignmentWorkspace Suite (Subtasks 6.2 - 6.5)', () => {
  const mockQuizLab: Partial<PracticeLabV1> = {
    id: 'lab-quiz-1',
    slug: 'sql-indexing-quiz',
    title: 'PostgreSQL Indexing Quiz',
    sandboxType: 'quizlet',
    envelope: {
      version: '1.0',
      sandboxType: 'quizlet',
      instructions: '# Quiz Instructions',
      config: {
        version: '1.0',
        passPercentage: 50,
        questions: [
          {
            id: 'q1',
            question: 'What is a B-Tree index?',
            options: ['Self-balancing search tree', 'Hash table', 'Bitmap'],
            correctIndex: 0,
            explanation: 'B-Tree is a self-balancing tree data structure.',
          },
          {
            id: 'q2',
            question: 'When should you use a GIN index?',
            options: ['Composite primary key', 'Full-text search or arrays', 'Auto-increment column'],
            correctIndex: 1,
            explanation: 'GIN is suited for full-text search, arrays, and JSONB.',
          },
        ],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all questions and updates answered count on option select', () => {
    const onCodeChange = vi.fn();

    render(
      <QuizAssignmentWorkspace
        lab={mockQuizLab as PracticeLabV1}
        code=""
        onCodeChange={onCodeChange}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('What is a B-Tree index?')).toBeDefined();
    expect(screen.getByText('When should you use a GIN index?')).toBeDefined();
    expect(screen.getByText('0/2 Answered')).toBeDefined();

    // Select option A for question 1
    const optionA = screen.getByLabelText(/Self-balancing search tree/i);
    fireEvent.click(optionA);

    expect(screen.getByText('1/2 Answered')).toBeDefined();
  });

  it('warns about unanswered questions before submitting', async () => {
    const onSubmit = vi.fn();

    render(
      <QuizAssignmentWorkspace
        lab={mockQuizLab as PracticeLabV1}
        code=""
        onCodeChange={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    // Only answer 1 question
    const optionA = screen.getByLabelText(/Self-balancing search tree/i);
    fireEvent.click(optionA);

    const submitBtn = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitBtn);

    // Warning dialog should appear
    expect(screen.getByText(/Incomplete Submission Warning/i)).toBeDefined();
    expect(screen.getByText(/You have/i)).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();

    // Click Continue Answering
    const continueBtn = screen.getByRole('button', { name: /Continue Answering/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Incomplete Submission Warning/i)).toBeNull();
    });
  });

  it('submits quiz, locks options, and displays score badge and explanation', async () => {
    const onSubmit = vi.fn();
    const onCodeChange = vi.fn();

    render(
      <QuizAssignmentWorkspace
        lab={mockQuizLab as PracticeLabV1}
        code=""
        onCodeChange={onCodeChange}
        onSubmit={onSubmit}
      />
    );

    // Answer Q1 correctly (opt 0)
    fireEvent.click(screen.getByLabelText(/Self-balancing search tree/i));
    // Answer Q2 correctly (opt 1)
    fireEvent.click(screen.getByLabelText(/Full-text search or arrays/i));

    const submitBtn = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    // Score badge should be visible and announceable to screen readers (Subtask 2.4)
    const scoreBadge = screen.getByRole('status');
    expect(scoreBadge).toBeDefined();
    expect(scoreBadge.getAttribute('aria-live')).toBe('polite');
    expect(scoreBadge.textContent).toContain('Passed: 100%');

    // Accessible text for correct answer icon
    expect(screen.getAllByText('(Correct answer)').length).toBeGreaterThan(0);

    // Explanation should now be visible
    expect(screen.getByText(/B-Tree is a self-balancing tree data structure/i)).toBeDefined();
  });

  it('enforces double-submit guard and shows incorrect answer accessibility label', async () => {
    const onSubmit = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 50)));

    render(
      <QuizAssignmentWorkspace
        lab={mockQuizLab as PracticeLabV1}
        code=""
        onCodeChange={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    // Answer Q1 incorrectly (opt 1 instead of 0)
    fireEvent.click(screen.getByLabelText(/Hash table/i));
    // Answer Q2 correctly (opt 1)
    fireEvent.click(screen.getByLabelText(/Full-text search or arrays/i));

    const submitBtn = screen.getByRole('button', { name: /Submit Quiz/i });
    // Fire double-click
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    // Verify incorrect choice has accessible screen reader text after async submit resolves
    await waitFor(() => {
      expect(screen.getByText('(Your incorrect choice)')).toBeDefined();
      expect(screen.getAllByText('(Correct answer)').length).toBeGreaterThan(0);
    });
  });

  it('opens and closes question palette modal', async () => {
    render(
      <QuizAssignmentWorkspace
        lab={mockQuizLab as PracticeLabV1}
        code=""
        onCodeChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const paletteBtn = screen.getByRole('button', { name: /Palette/i });
    fireEvent.click(paletteBtn);

    expect(screen.getByText(/Question Palette/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Jump to question 1/i })).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /Close Palette/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Question Palette/i)).toBeNull();
    });
  });

  it('highlights correct answer even when question.correctIndex is omitted and resolved via gradingDetail', () => {
    const questionWithoutCorrectIndex = {
      id: 'q-secure',
      question: 'What is ACID in database systems?',
      options: ['Atomicity, Consistency, Isolation, Durability', 'Arbitrary Code In Database'],
      // correctIndex omitted intentionally
    } as any;

    const gradingDetail = {
      questionId: 'q-secure',
      selectedOptionIndex: 0,
      correctOptionIndex: 0,
      isCorrect: true,
      isAnswered: true,
      explanation: 'ACID guarantees database transaction reliability.',
    };

    render(
      <QuizQuestionCard
        question={questionWithoutCorrectIndex}
        index={0}
        selectedOptionIndex={0}
        onSelectOption={vi.fn()}
        isSubmitted={true}
        gradingDetail={gradingDetail}
      />
    );

    // Option 0 should have the correct answer text & badge
    expect(screen.getByText('(Correct answer)')).toBeDefined();
    expect(screen.getByText('Correct')).toBeDefined();
    expect(screen.getByText(/ACID guarantees database transaction reliability/i)).toBeDefined();
  });

  it('consumes server-authoritative review from onSubmit and displays concept review button', async () => {
    // Simulate stripped question (anti-cheat: no correctIndex or explanation on client)
    const secureLab: Partial<PracticeLabV1> = {
      id: 'lab-secure-quiz',
      slug: 'secure-quiz',
      title: 'Module 1 Knowledge Check',
      sandboxType: 'quizlet',
      envelope: {
        version: '1.0',
        sandboxType: 'quizlet',
        instructions: 'Test instructions',
        config: {
          version: '1.0',
          passPercentage: 70,
          questions: [
            {
              id: 'sec_q1',
              question: 'Which HTTP status represents unauthorized access?',
              options: ['200 OK', '401 Unauthorized', '500 Server Error'],
              // Stripped on server: correctIndex omitted
            } as any,
          ],
        },
      },
    };

    const mockServerReview = {
      scorePercentage: 100,
      passed: true,
      passedQuestionsCount: 1,
      totalQuestions: 1,
      details: [
        {
          questionId: 'sec_q1',
          selectedOptionIndex: 1,
          correctOptionIndex: 1,
          isCorrect: true,
          isAnswered: true,
          explanation: '401 Unauthorized indicates the client must authenticate.',
        },
      ],
    };

    const onSubmit = vi.fn().mockResolvedValue({ review: mockServerReview });

    render(
      <QuizAssignmentWorkspace
        lab={secureLab as PracticeLabV1}
        code=""
        onCodeChange={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    // Initial state: Knowledge check intro banner visible
    expect(screen.getByRole('heading', { name: /Module 1 Knowledge Check/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Review Concepts/i })).toBeDefined();

    // Select option 1
    fireEvent.click(screen.getByLabelText(/401 Unauthorized/i));

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    // Score badge should reflect 100% from server response
    await waitFor(() => {
      const scoreBadge = screen.getByRole('status');
      expect(scoreBadge.textContent).toContain('Passed: 100%');
    });

    // Authoritative explanation returned by server should be displayed
    expect(screen.getByText(/401 Unauthorized indicates the client must authenticate/i)).toBeDefined();
    expect(screen.getAllByText('(Correct answer)').length).toBeGreaterThan(0);
  });
});
