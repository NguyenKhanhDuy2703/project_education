import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TheoryLessonView } from '../features/lab/strategies/TheoryLessonView';
import { getWorkspaceStrategy } from '../features/lab/strategies/workspaceRegistry';
import { getUnitTypeInfo } from '../services/formatBadge.service';
import { renderMarkdown } from '../pages/lab/_components/renderMarkdown';
import type { PracticeLabV1 } from '../types/lab.types';

describe('Task 3: Learning Unit Presentation Patterns & Theory Experience', () => {
  const sampleTheoryLab: PracticeLabV1 = {
    id: 'theory-unit-1',
    seriesId: 'series-test',
    title: 'Testing Fundamentals: 7 Principles',
    slug: 'testing-fundamentals-7-principles',
    order: 1,
    sandboxType: 'markdown_only',
    unitType: 'theory',
    durationMinutes: 12,
    isFreePreview: true,
    isProOnly: false,
    envelope: {
      version: '1.0',
      sandboxType: 'markdown_only',
      instructions: `
# Seven Testing Principles

Testing is an essential phase in software development.

## Principle 1: Testing Shows Presence of Defects
Testing can show that defects are present, but cannot prove that there are no defects.

## Principle 2: Exhaustive Testing is Impossible
Testing everything is not feasible except in trivial cases.

### Formative Checkpoint
Review concepts below.
      `,
      initialSnippet: '',
      config: {
        readingTimeMinutes: 12,
        formativeQuestions: [
          {
            id: 'fq1',
            question: 'Can testing prove a system is 100% bug-free?',
            options: ['Yes, if 100% test pass', 'No, testing shows presence not absence of defects', 'Only on Prod'],
            correctIndex: 1,
            hint: 'Recall principle 1.',
            explanation: 'Testing only shows presence of defects, not absence.',
          },
        ],
      },
    } as any,
  };

  it('maps markdown_only to TheoryLessonView via workspace registry', () => {
    const strategy = getWorkspaceStrategy('markdown_only');
    expect(strategy).toBeDefined();
    expect(strategy.name).toContain('TheoryLessonView');
  });

  it('renders TheoryLessonView with title, TOC outline, formative questions, and completion card', () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <TheoryLessonView
          lab={sampleTheoryLab}
          code=""
          onCodeChange={() => {}}
          onSubmit={handleSubmit}
        />
      </MemoryRouter>
    );

    // Assert title and lesson badge
    expect(screen.getByRole('heading', { name: /Testing Fundamentals: 7 Principles/i })).toBeDefined();
    expect(screen.getByText('Interactive Theory Lesson')).toBeDefined();
    expect(screen.getByText('Concept Check (1 question)')).toBeDefined();

    // Assert formative question and options
    expect(screen.getByText('Can testing prove a system is 100% bug-free?')).toBeDefined();
    expect(screen.getByText('No, testing shows presence not absence of defects')).toBeDefined();

    // Assert Complete Lesson button
    const completeBtn = screen.getByRole('button', { name: /Complete Lesson & Continue/i });
    expect(completeBtn).toBeDefined();
  });

  it('interactively verifies formative answers with immediate visual feedback', () => {
    render(
      <MemoryRouter>
        <TheoryLessonView
          lab={sampleTheoryLab}
          code=""
          onCodeChange={() => {}}
          onSubmit={vi.fn()}
        />
      </MemoryRouter>
    );

    // Click wrong answer first
    const wrongOpt = screen.getByText('Yes, if 100% test pass');
    fireEvent.click(wrongOpt);
    expect(screen.getByText(/Try again/i)).toBeDefined();
    expect(screen.getByText(/Hint: Recall principle 1/i)).toBeDefined();

    // Click correct answer
    const correctOpt = screen.getByText('No, testing shows presence not absence of defects');
    fireEvent.click(correctOpt);
    expect(screen.getByText(/✓ Correct/i)).toBeDefined();
    expect(screen.getByText(/Testing only shows presence of defects, not absence/i)).toBeDefined();
  });

  it('triggers completion and transitions status on complete button click', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <TheoryLessonView
          lab={sampleTheoryLab}
          code=""
          onCodeChange={() => {}}
          onSubmit={handleSubmit}
        />
      </MemoryRouter>
    );

    const completeBtn = screen.getByRole('button', { name: /Complete Lesson & Continue/i });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'passed',
          testLogs: expect.stringContaining('Theory lesson completed'),
        })
      );
    });
  });

  it('correctly maps unit types to distinct labels and pedagogical badges', () => {
    expect(getUnitTypeInfo('theory', 'markdown_only').label).toBe('Lesson');
    expect(getUnitTypeInfo('theory', 'markdown_only').ctaText).toBe('Read lesson');

    expect(getUnitTypeInfo('sql_practice', 'sql_worker').label).toBe('SQL Lab');
    expect(getUnitTypeInfo('sql_practice', 'sql_worker').ctaText).toBe('Start SQL Lab');

    expect(getUnitTypeInfo('quiz_checkpoint', 'quizlet').label).toBe('Knowledge Check');
    expect(getUnitTypeInfo('quiz_checkpoint', 'quizlet').ctaText).toBe('Take checkpoint');

    expect(getUnitTypeInfo('automation_lab', 'automation_v3').label).toBe('Automation Lab');
    expect(getUnitTypeInfo('automation_lab', 'automation_v3').ctaText).toBe('Start Automation Lab');
  });

  it('generates slug id attributes for markdown headings to enable deep TOC navigation', () => {
    const rawMarkdown = `
# Seven Principles of Testing
## Defect Clustering
### Early Testing
    `;

    const html = renderMarkdown(rawMarkdown);
    expect(html).toContain('id="seven-principles-of-testing"');
    expect(html).toContain('id="defect-clustering"');
    expect(html).toContain('id="early-testing"');
  });
});
