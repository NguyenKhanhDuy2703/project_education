import { describe, it, expect } from 'vitest';
import {
  validatePlaywrightScenario,
  generateParameterizedPlaywrightCode,
  compileScenarioToAutomationExercise,
} from '@/features/lab/runtime/playwrightScenarioCompiler';
import type { PlaywrightParameterizedScenario } from '@/types/lab.types';

describe('Playwright Parameterized Scenario Contract (Subtask 4.1)', () => {
  const validScenario: PlaywrightParameterizedScenario = {
    scenarioId: 'scen-auth-01',
    title: 'Role-Based Authentication Access Matrix',
    baseUrlOrRoute: '/login',
    matcher: 'toHaveText',
    dataset: [
      {
        caseId: 'ROLE_USER',
        title: 'Standard User Lands on User Dashboard',
        inputs: { role: 'user', selector: '[data-testid="page-heading"]' },
        expected: { value: 'Learner Dashboard' },
      },
      {
        caseId: 'ROLE_ADMIN',
        title: 'Admin User Lands on Management Dashboard',
        inputs: { role: 'admin', selector: '[data-testid="page-heading"]' },
        expected: { value: 'Admin Overview' },
      },
    ],
  };

  it('validates a correct scenario successfully', () => {
    const result = validatePlaywrightScenario(validScenario);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects duplicate test case titles or IDs', () => {
    const duplicateTitleScenario: PlaywrightParameterizedScenario = {
      ...validScenario,
      dataset: [
        {
          caseId: 'ROLE_1',
          title: 'Duplicate Title Test',
          inputs: { role: 'user' },
          expected: { value: 'Dashboard' },
        },
        {
          caseId: 'ROLE_2',
          title: 'Duplicate Title Test',
          inputs: { role: 'admin' },
          expected: { value: 'Admin' },
        },
      ],
    };

    const result = validatePlaywrightScenario(duplicateTitleScenario);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('Duplicate test title'))).toBe(true);
  });

  it('rejects empty dataset or missing route', () => {
    const invalidScenario: Partial<PlaywrightParameterizedScenario> = {
      title: 'Missing Route',
      baseUrlOrRoute: '',
      dataset: [],
    };

    const result = validatePlaywrightScenario(invalidScenario);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('generates valid parameterized Playwright code', () => {
    const code = generateParameterizedPlaywrightCode(validScenario);
    expect(code).toContain("import { test, expect } from '@playwright/test';");
    expect(code).toContain('scenarios.forEach');
    expect(code).toContain('test(`${caseId}: ${title}`');
    expect(code).toContain("page.goto('/login')");
  });

  it('compiles scenario into AutomationExerciseV2 with cloze blanks and managed segments', () => {
    const exercise = compileScenarioToAutomationExercise(validScenario);
    expect(exercise.version).toBe('2.0');
    expect(exercise.framework).toBe('playwright');
    expect(exercise.blanks).toHaveLength(1);
    expect(exercise.blanks[0].id).toBe('blank_matcher');
    expect(exercise.publicTemplate.some((seg) => seg.kind === 'managed')).toBe(true);
  });
});
