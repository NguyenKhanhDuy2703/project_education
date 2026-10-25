/**
 * playwrightV3Compiler.ts
 *
 * Compiles Automation V3 declarative step plans into standard, valid Playwright TypeScript code.
 * Ensures:
 * - Proper imports: import { test, expect } from '@playwright/test';
 * - Unique, deterministic test titles
 * - Web-first assertions and resilient locators
 * - Clean comments mapping to steps
 */

import type { AutomationStep, AutomationExerciseV3 } from '@/types/lab.types';

export function compilePlanToPlaywrightCode(
  exercise: Partial<AutomationExerciseV3>,
  steps: AutomationStep[],
): string {
  const title = exercise.title || 'Automation Scenario';
  const fixtureId = exercise.fixture?.fixtureId || 'app';
  const initialRoute = exercise.fixture?.initialRoute || '/';

  const stepLines: string[] = [];

  steps.forEach((step, idx) => {
    const num = idx + 1;
    switch (step.blockType) {
      case 'nav_goto': {
        const route = step.params.route || initialRoute;
        stepLines.push(`    // Step ${num}: Navigate to target route\n    await page.goto('${route}');`);
        break;
      }

      case 'act_click': {
        const locator = step.params.locator || "page.getByRole('button')";
        stepLines.push(`    // Step ${num}: Click target element\n    await ${locator}.click();`);
        break;
      }

      case 'act_fill': {
        const locator = step.params.locator || "page.getByRole('textbox')";
        const val = step.params.value || '';
        stepLines.push(`    // Step ${num}: Fill input field\n    await ${locator}.fill('${val}');`);
        break;
      }

      case 'act_check': {
        const locator = step.params.locator || "page.getByRole('checkbox')";
        stepLines.push(`    // Step ${num}: Check checkbox\n    await ${locator}.check();`);
        break;
      }

      case 'act_select_option': {
        const locator = step.params.locator || 'page.locator("select")';
        const val = step.params.value || '';
        stepLines.push(`    // Step ${num}: Select dropdown option\n    await ${locator}.selectOption('${val}');`);
        break;
      }

      case 'assert_visible': {
        const locator = step.params.locator || "page.getByRole('status')";
        stepLines.push(`    // Step ${num}: Verify element is visible\n    await expect(${locator}).toBeVisible();`);
        break;
      }

      case 'assert_text': {
        const locator = step.params.locator || 'page.locator("body")';
        const exp = step.params.expected || '';
        stepLines.push(`    // Step ${num}: Verify text content\n    await expect(${locator}).toHaveText('${exp}');`);
        break;
      }

      case 'assert_value': {
        const locator = step.params.locator || "page.getByRole('textbox')";
        const exp = step.params.expected || '';
        stepLines.push(`    // Step ${num}: Verify input value\n    await expect(${locator}).toHaveValue('${exp}');`);
        break;
      }

      case 'assert_count': {
        const locator = step.params.locator || 'page.locator("tr")';
        const count = step.params.count ?? 1;
        stepLines.push(`    // Step ${num}: Verify element count\n    await expect(${locator}).toHaveCount(${count});`);
        break;
      }

      case 'assert_url': {
        const url = step.params.url || '/';
        stepLines.push(`    // Step ${num}: Verify target route URL\n    await expect(page).toHaveURL('${url}');`);
        break;
      }

      default: {
        stepLines.push(`    // Step ${num}: Custom step (${step.blockType})`);
        break;
      }
    }
  });

  const body = stepLines.length > 0 ? stepLines.join('\n\n') : '    // No steps defined';

  return `import { test, expect } from '@playwright/test';

/**
 * Playwright Automation Scenario: ${title}
 * Fixture: ${fixtureId} (${exercise.fixture?.fixtureVersion || '1.0.0'})
 * Mode: ${exercise.interactionMode || 'block_builder'}
 * Content Revision: ${exercise.contentRevision || 'v1'}
 */
test.describe('${title}', () => {
  test('verify expected scenario workflow', async ({ page }) => {
${body}
  });
});
`;
}
