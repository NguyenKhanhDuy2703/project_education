import type {
  PlaywrightParameterizedScenario,
  AutomationExerciseV2,
  BlankDefinition,
  TemplateSegment,
} from '@/types/lab.types';

export interface ScenarioValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePlaywrightScenario(
  scenario: Partial<PlaywrightParameterizedScenario>
): ScenarioValidationResult {
  const errors: string[] = [];

  if (!scenario.title || scenario.title.trim() === '') {
    errors.push('Scenario title is required.');
  }

  if (!scenario.baseUrlOrRoute || scenario.baseUrlOrRoute.trim() === '') {
    errors.push('Target route or URL is required.');
  }

  if (!scenario.dataset || !Array.isArray(scenario.dataset) || scenario.dataset.length === 0) {
    errors.push('At least one dataset row is required for parameterization.');
  } else {
    const titles = new Set<string>();
    const caseIds = new Set<string>();

    scenario.dataset.forEach((row, index) => {
      if (!row.caseId || row.caseId.trim() === '') {
        errors.push(`Row ${index + 1}: Case ID is required.`);
      } else if (caseIds.has(row.caseId)) {
        errors.push(`Row ${index + 1}: Duplicate Case ID "${row.caseId}".`);
      } else {
        caseIds.add(row.caseId);
      }

      if (!row.title || row.title.trim() === '') {
        errors.push(`Row ${index + 1}: Case title is required.`);
      } else if (titles.has(row.title)) {
        errors.push(`Row ${index + 1}: Duplicate test title "${row.title}". Each parameterized test must have a unique title.`);
      } else {
        titles.add(row.title);
      }

      if (!row.inputs || typeof row.inputs !== 'object') {
        errors.push(`Row ${index + 1}: Inputs object is required.`);
      }

      if (!row.expected || typeof row.expected !== 'object') {
        errors.push(`Row ${index + 1}: Expected result object is required.`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function generateParameterizedPlaywrightCode(
  scenario: PlaywrightParameterizedScenario
): string {
  const datasetJson = JSON.stringify(scenario.dataset, null, 2);
  const matcher = scenario.matcher || 'toBeVisible';

  return `import { test, expect } from '@playwright/test';

// Parameterized Test Scenario: ${scenario.title}
// Target: ${scenario.baseUrlOrRoute}
const scenarios = ${datasetJson};

scenarios.forEach(({ caseId, title, inputs, expected }) => {
  test(\`\${caseId}: \${title}\`, async ({ page }) => {
    // 1. Navigate to target route
    await page.goto('${scenario.baseUrlOrRoute}');

    // 2. Perform actions with parameterized inputs
    ${scenario.actionTemplate || '// Parameterized interaction step'}

    // 3. Assert outcome
    ${scenario.expectedOutcome || `await expect(page.locator(inputs.selector || 'body')).${matcher}(expected.value);`}
  });
});
`;
}

export function compileScenarioToAutomationExercise(
  scenario: PlaywrightParameterizedScenario
): AutomationExerciseV2 {
  const validation = validatePlaywrightScenario(scenario);
  if (!validation.isValid) {
    throw new Error(`Invalid scenario: ${validation.errors.join(', ')}`);
  }

  const blanks: BlankDefinition[] = [
    {
      id: 'blank_matcher',
      kind: 'matcher',
      label: 'Playwright Assertion Matcher',
      valueType: 'enum',
      required: true,
      defaultValue: scenario.matcher || 'toBeVisible',
      options: [
        { value: 'toBeVisible', label: 'toBeVisible() - Element is present & visible' },
        { value: 'toHaveText', label: 'toHaveText(expected) - Exact text match' },
        { value: 'toHaveCount', label: 'toHaveCount(n) - Matched element count' },
        { value: 'toContain', label: 'toContain(item) - Array or substring containment' },
      ],
      helperText: 'Select the appropriate Playwright web-first assertion matcher.',
    },
  ];

  const publicTemplate: TemplateSegment[] = [
    {
      kind: 'readonly',
      text: `import { test, expect } from '@playwright/test';\n\n// Parameterized Scenario: ${scenario.title}\n`,
    },
    {
      kind: 'managed',
      label: `Dataset (${scenario.dataset.length} cases)`,
      summary: `Defines data matrix for ${scenario.dataset.map((d) => d.caseId).join(', ')}`,
      code: `const testCases = ${JSON.stringify(scenario.dataset, null, 2)};\n`,
    },
    {
      kind: 'readonly',
      text: `\ntestCases.forEach(({ caseId, title, inputs, expected }) => {\n  test(\`[\${caseId}] \${title}\`, async ({ page }) => {\n    await page.goto('${scenario.baseUrlOrRoute}');\n`,
    },
    {
      kind: 'managed',
      label: 'Action Execution',
      summary: 'Automates user actions based on input parameters',
      code: `    // Automate interaction\n    ${scenario.actionTemplate || 'const target = page.locator(inputs.selector);\n    await target.fill(inputs.value || "");'}\n`,
    },
    {
      kind: 'readonly',
      text: '    // Parameterized Assertion\n    await expect(page.locator(inputs.selector || "body")).',
    },
    {
      kind: 'blank',
      blankId: 'blank_matcher',
    },
    {
      kind: 'readonly',
      text: '(expected.value);\n  });\n});\n',
    },
  ];

  return {
    version: '2.0',
    interactionMode: 'smart_cloze',
    framework: 'playwright',
    publicTemplate,
    blanks,
    publicChecks: [
      {
        id: 'chk_unique_titles',
        name: 'Deterministic Unique Test Titles',
        description: 'Every parameterized test execution generates a unique title for reporting.',
        conceptTag: 'parameterization',
      },
      {
        id: 'chk_matcher',
        name: 'Web-First Assertion',
        blankId: 'blank_matcher',
        conceptTag: 'assertions',
      },
    ],
    gradingRules: [
      {
        blankId: 'blank_matcher',
        acceptedValues: Array.from(new Set([scenario.matcher || 'toBeVisible', 'toBeVisible', 'toHaveText'])),
      },
    ],
  };
}
