# Playwright Parameterized Low-Code Contract (v1.0)

> **Document Type**: Technical Specification
> **Status**: Approved & Frozen
> **Standards Reference**: DEC-08, Task 4
> **Playwright Upstream Reference**: [Playwright Test Parameterize](https://playwright.dev/docs/test-parameterize)

---

## 1. Overview & Rationale

Instead of unparameterized, repetitive automation scripts or static cheat sheets, this contract enables scenario-driven test definitions where:
1. Datasets represent distinct test conditions (e.g. role access, input boundaries, locale strings).
2. Each test case receives a **unique, descriptive test title** (`[caseId] title`) to prevent ambiguity in Playwright test runners and HTML reports.
3. Tests iterate over datasets cleanly using `dataset.forEach(...)`.
4. Shared lifecycle hooks (`beforeAll`, `afterAll`, `beforeEach`) remain **outside** parameter loops.
5. In browser worker execution or smart-cloze workspaces, code compiles into typed `AutomationExerciseV2` structures with read-only wrappers, managed boilerplate, and interactive blanks.

---

## 2. Low-Code Data Contract

```typescript
export interface PlaywrightScenarioDatasetRow {
  caseId: string;
  title: string;
  inputs: Record<string, any>;
  expected: Record<string, any>;
}

export type PlaywrightMatcher =
  | 'toBe'
  | 'toEqual'
  | 'toHaveText'
  | 'toBeVisible'
  | 'toHaveCount'
  | 'toContain'
  | 'toHaveValue';

export interface PlaywrightParameterizedScenario {
  scenarioId: string;
  title: string;
  description?: string;
  baseUrlOrRoute: string;
  dataset: PlaywrightScenarioDatasetRow[];
  actionTemplate?: string;
  locatorIntent?: string;
  expectedOutcome?: string;
  matcher: PlaywrightMatcher;
}
```

---

## 3. Parameterized Code Compilation Pattern

When compiled, scenarios produce valid TypeScript syntax following standard Playwright conventions:

```typescript
import { test, expect } from '@playwright/test';

const scenarios = [
  {
    caseId: 'AUTH_01',
    title: 'Standard user dashboard access',
    inputs: { role: 'user', selector: '[data-testid="welcome-banner"]' },
    expected: { value: 'Welcome back, Learner' }
  },
  {
    caseId: 'AUTH_02',
    title: 'Admin management panel access',
    inputs: { role: 'admin', selector: '[data-testid="admin-panel"]' },
    expected: { value: 'Admin Overview' }
  }
];

scenarios.forEach(({ caseId, title, inputs, expected }) => {
  test(`[${caseId}] ${title}`, async ({ page }) => {
    await page.goto('/login');
    // actions...
    await expect(page.locator(inputs.selector)).toHaveText(expected.value);
  });
});
```

---

## 4. Validation Rules

1. **Title Uniqueness**: Every row in `dataset` must have a non-empty, unique `caseId` and `title`. Duplicate titles cause Playwright reporting collisions and will be rejected.
2. **Deterministic Inputs**: `inputs` and `expected` must be non-null objects containing concrete test values.
3. **Target Navigation**: `baseUrlOrRoute` must not be empty.
