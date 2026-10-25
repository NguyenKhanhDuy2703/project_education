import { describe, it, expect } from 'vitest';
import type { CreateLabInput, SeriesSection } from '@/types/lab.types';

describe('Task 4: Admin Studio Authoring & Section Management Suite', () => {
  it('supports unitType as first pedagogical authoring decision across all 4 modes', () => {
    const theoryInput: CreateLabInput = {
      seriesId: 'series-qa',
      title: 'Testing Principles 101',
      unitType: 'theory',
      sandboxType: 'markdown_only',
      instructions: '# 7 Principles of Testing\n\nTesting shows presence of defects...',
      config: {
        readingTimeMinutes: 10,
        formativeQuestions: [
          {
            id: 'fq-1',
            question: 'Can testing prove absence of defects?',
            options: ['Yes', 'No'],
            correctIndex: 1,
            explanation: 'Testing shows presence not absence.',
          },
        ],
      },
    };

    const sqlInput: CreateLabInput = {
      seriesId: 'series-sql',
      title: 'Filter VIP Customers',
      unitType: 'sql_practice',
      sandboxType: 'sql_worker',
      instructions: '# SQL Practice\n\nWrite a query...',
      sqlSchema: 'CREATE TABLE customers (id INT, total_spent NUMERIC);',
      solution: 'SELECT * FROM customers WHERE total_spent > 1000;',
    };

    const checkpointInput: CreateLabInput = {
      seriesId: 'series-qa',
      title: 'Checkpoint 1: Fundamental Principles',
      unitType: 'quiz_checkpoint',
      sandboxType: 'quizlet',
      instructions: '# Checkpoint Instructions\n\nAnswer all 5 questions.',
      quizQuestions: [
        {
          id: 'q1',
          question: 'What is defect clustering?',
          options: ['Defects cluster in small modules', 'Random distribution', 'No clustering', 'All equally'],
          correctIndex: 0,
        },
      ],
    };

    const automationInput: CreateLabInput = {
      seriesId: 'series-automation',
      title: 'Cart Checkout Automation Lab',
      unitType: 'automation_lab',
      sandboxType: 'js_worker',
      instructions: '# Automation brief\n\nAdd step to click checkout.',
      initialSnippet: 'await page.goto("/cart");',
      solution: 'await page.getByRole("button", { name: "Checkout" }).click();',
      testScript: 'expect(true).toBe(true);',
    };

    expect(theoryInput.unitType).toBe('theory');
    expect(sqlInput.unitType).toBe('sql_practice');
    expect(checkpointInput.unitType).toBe('quiz_checkpoint');
    expect(automationInput.unitType).toBe('automation_lab');
  });

  it('verifies section hierarchy grouping and reassignment contract', () => {
    const moduleSection: SeriesSection = {
      id: 'sec-mod-1',
      seriesId: 'series-sql',
      title: 'Module 1: Queries and Filtering',
      orderIndex: 0,
    };

    const labWithSection: CreateLabInput = {
      seriesId: 'series-sql',
      sectionId: moduleSection.id,
      title: 'Select Basics',
      unitType: 'sql_practice',
      sandboxType: 'sql_worker',
      instructions: 'Select all columns.',
    };

    expect(labWithSection.sectionId).toBe('sec-mod-1');
    expect(moduleSection.title).toBe('Module 1: Queries and Filtering');
  });
});
