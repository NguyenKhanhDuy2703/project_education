import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizAssignmentWorkspace } from '../features/lab/strategies/QuizAssignmentWorkspace';
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
      expect(onSubmit).toHaveBeenCalled();
    });

    // Score badge should be visible
    expect(screen.getByText(/Passed: 100%/i)).toBeDefined();

    // Explanation should now be visible
    expect(screen.getByText(/B-Tree is a self-balancing tree data structure/i)).toBeDefined();
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
});
