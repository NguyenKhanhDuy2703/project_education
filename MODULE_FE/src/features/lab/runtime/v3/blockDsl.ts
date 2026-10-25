/**
 * blockDsl.ts
 *
 * Safe DSL Allowlist definitions and step validator for Automation V3.
 * Enforces Playwright best practices and blocks arbitrary JavaScript execution.
 */

import type {
  AutomationBlockDefinition,
  AutomationStep,
} from '@/types/lab.types';

export const BUILTIN_BLOCK_DEFINITIONS: Record<string, AutomationBlockDefinition> = {
  // ── Navigation Blocks ────────────────────────────────────────────────────────
  nav_goto: {
    blockType: 'nav_goto',
    category: 'navigation',
    name: 'Navigate to Route (page.goto)',
    description: 'Navigates the browser to the specified route within the fixture application.',
    codePattern: "await page.goto('{route}');",
    parameters: [
      {
        id: 'route',
        name: 'route',
        label: 'Target Route',
        type: 'string',
        required: true,
        defaultValue: '/',
        placeholder: 'e.g. /orders, /login, /shop',
      },
    ],
  },

  // ── Locator Blocks (Accessible & Web-First) ──────────────────────────────────
  loc_role: {
    blockType: 'loc_role',
    category: 'locator',
    name: 'Get By Role (getByRole)',
    description: 'Finds an element by ARIA role and accessible name. Recommended by Playwright best practices.',
    codePattern: "page.getByRole('{role}', { name: '{name}' })",
    parameters: [
      {
        id: 'role',
        name: 'role',
        label: 'ARIA Role',
        type: 'role',
        required: true,
        defaultValue: 'button',
        options: [
          { value: 'button', label: 'button - Clickable button' },
          { value: 'heading', label: 'heading - Section header (h1..h6)' },
          { value: 'textbox', label: 'textbox - Text input field' },
          { value: 'checkbox', label: 'checkbox - Toggle checkbox' },
          { value: 'status', label: 'status - Live status region' },
          { value: 'table', label: 'table - Data table' },
          { value: 'region', label: 'region - Content section' },
          { value: 'alert', label: 'alert - Important notification message' },
        ],
      },
      {
        id: 'name',
        name: 'name',
        label: 'Accessible Name / Text',
        type: 'string',
        required: true,
        placeholder: 'e.g. Sign In, Search Orders, Add to Cart',
      },
    ],
  },

  loc_label: {
    blockType: 'loc_label',
    category: 'locator',
    name: 'Get By Label (getByLabel)',
    description: 'Finds an associated input control by its <label> text or aria-label.',
    codePattern: "page.getByLabel('{label}')",
    parameters: [
      {
        id: 'label',
        name: 'label',
        label: 'Label Text',
        type: 'string',
        required: true,
        placeholder: 'e.g. Email Address, Password, Remember me',
      },
    ],
  },

  loc_text: {
    blockType: 'loc_text',
    category: 'locator',
    name: 'Get By Text (getByText)',
    description: 'Finds an element containing the specified visible text string.',
    codePattern: "page.getByText('{text}')",
    parameters: [
      {
        id: 'text',
        name: 'text',
        label: 'Visible Text',
        type: 'string',
        required: true,
        placeholder: 'e.g. Order Placed Successfully, $85.00',
      },
    ],
  },

  loc_testid: {
    blockType: 'loc_testid',
    category: 'locator',
    name: 'Get By Test ID (getByTestId)',
    description: 'Finds an element using the data-testid attribute for stable testing.',
    codePattern: "page.getByTestId('{testId}')",
    parameters: [
      {
        id: 'testId',
        name: 'testId',
        label: 'Test ID Value',
        type: 'string',
        required: true,
        placeholder: 'e.g. order-row-101, product-1',
      },
    ],
  },

  loc_filter: {
    blockType: 'loc_filter',
    category: 'locator',
    name: 'Filter Locator (filter)',
    description: 'Refines locator matching by nested text condition.',
    codePattern: "{target}.filter({ hasText: '{hasText}' })",
    parameters: [
      {
        id: 'target',
        name: 'target',
        label: 'Base Locator',
        type: 'string',
        required: true,
        placeholder: "e.g. page.getByRole('row')",
      },
      {
        id: 'hasText',
        name: 'hasText',
        label: 'Has Text',
        type: 'string',
        required: true,
        placeholder: 'e.g. Failed, Completed',
      },
    ],
  },

  // ── Action Blocks ────────────────────────────────────────────────────────────
  act_click: {
    blockType: 'act_click',
    category: 'action',
    name: 'Click (click)',
    description: 'Waits for element to be actionable and clicks it.',
    codePattern: 'await {locator}.click();',
    parameters: [
      {
        id: 'locator',
        name: 'locator',
        label: 'Target Element Locator',
        type: 'string',
        required: true,
        placeholder: "e.g. page.getByRole('button', { name: 'Search' })",
      },
    ],
  },

  act_fill: {
    blockType: 'act_fill',
    category: 'action',
    name: 'Fill Input (fill)',
    description: 'Clears the input field and fills it with the specified text string.',
    codePattern: "await {locator}.fill('{value}');",
    parameters: [
      {
        id: 'locator',
        name: 'locator',
        label: 'Input Field Locator',
        type: 'string',
        required: true,
        placeholder: "e.g. page.getByLabel('Email Address')",
      },
      {
        id: 'value',
        name: 'value',
        label: 'Text Value to Type',
        type: 'string',
        required: true,
        placeholder: 'e.g. admin@studyweb.dev, ORD-9021',
      },
    ],
  },

  act_check: {
    blockType: 'act_check',
    category: 'action',
    name: 'Check Checkbox (check)',
    description: 'Ensures a checkbox or radio button is checked.',
    codePattern: 'await {locator}.check();',
    parameters: [
      {
        id: 'locator',
        name: 'locator',
        label: 'Checkbox Locator',
        type: 'string',
        required: true,
        placeholder: "e.g. page.getByLabel('Remember me')",
      },
    ],
  },

  act_select_option: {
    blockType: 'act_select_option',
    category: 'action',
    name: 'Select Option (selectOption)',
    description: 'Selects one or more options in a <select> dropdown element.',
    codePattern: "await {locator}.selectOption('{value}');",
    parameters: [
      {
        id: 'locator',
        name: 'locator',
        label: 'Dropdown Locator',
        type: 'string',
        required: true,
        placeholder: "e.g. page.getByLabel('Select Role')",
      },
      {
        id: 'value',
        name: 'value',
        label: 'Option Value to Select',
        type: 'string',
        required: true,
        placeholder: 'e.g. admin, subscriber, standard',
      },
    ],
  },

  // ── Web-First Assertion Blocks ──────────────────────────────────────────────
  assert_visible: {
    blockType: 'assert_visible',
    category: 'assertion',
    name: 'Expect To Be Visible (toBeVisible)',
    description: 'Playwright web-first assertion: auto-retries until element is present and visible.',
    codePattern: 'await expect({locator}).toBeVisible();',
    parameters: [
      {
        id: 'locator',
        name: 'locator',
        label: 'Target Element Locator',
        type: 'string',
        required: true,
        placeholder: "e.g. page.getByRole('status')",
      },
    ],
  },

  assert_text: {
    blockType: 'assert_text',
    category: 'assertion',
    name: 'Expect To Have Text (toHaveText)',
    description: 'Playwright web-first assertion: auto-retries until element has exact or matching text.',
    codePattern: "await expect({locator}).toHaveText('{expected}');",
    parameters: [
      {
        id: 'locator',
        name: 'locator',
        label: 'Target Element Locator',
        type: 'string',
        required: true,
        placeholder: "e.g. page.getByRole('heading')",
      },
      {
        id: 'expected',
        name: 'expected',
        label: 'Expected Text Content',
        type: 'string',
        required: true,
        placeholder: 'e.g. Admin Control Center, Failed',
      },
    ],
  },

  assert_value: {
    blockType: 'assert_value',
    category: 'assertion',
    name: 'Expect To Have Value (toHaveValue)',
    description: 'Playwright web-first assertion: auto-retries until input element has the specified value.',
    codePattern: "await expect({locator}).toHaveValue('{expected}');",
    parameters: [
      {
        id: 'locator',
        name: 'locator',
        label: 'Input Field Locator',
        type: 'string',
        required: true,
        placeholder: "e.g. page.getByLabel('Email Address')",
      },
      {
        id: 'expected',
        name: 'expected',
        label: 'Expected Input Value',
        type: 'string',
        required: true,
        placeholder: 'e.g. admin@studyweb.dev',
      },
    ],
  },

  assert_count: {
    blockType: 'assert_count',
    category: 'assertion',
    name: 'Expect To Have Count (toHaveCount)',
    description: 'Playwright web-first assertion: auto-retries until locator resolves to exact count of elements.',
    codePattern: 'await expect({locator}).toHaveCount({count});',
    parameters: [
      {
        id: 'locator',
        name: 'locator',
        label: 'Collection Locator',
        type: 'string',
        required: true,
        placeholder: "e.g. page.getByRole('row')",
      },
      {
        id: 'count',
        name: 'count',
        label: 'Expected Element Count',
        type: 'number',
        required: true,
        defaultValue: 1,
      },
    ],
  },

  assert_url: {
    blockType: 'assert_url',
    category: 'assertion',
    name: 'Expect To Have URL (toHaveURL)',
    description: 'Playwright web-first assertion: auto-retries until page URL matches the target route or regex.',
    codePattern: "await expect(page).toHaveURL('{url}');",
    parameters: [
      {
        id: 'url',
        name: 'url',
        label: 'Expected Route URL',
        type: 'string',
        required: true,
        placeholder: 'e.g. /dashboard/admin, /checkout',
      },
    ],
  },
};

export interface PlanValidationResult {
  isValid: boolean;
  errors: string[];
}

const MAX_STEPS_ALLOWED = 50;

/**
 * Validates a declarative automation step plan against allowed block definitions.
 */
export function validateAutomationPlan(
  steps: AutomationStep[],
  allowedBlocks: AutomationBlockDefinition[],
): PlanValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(steps)) {
    return { isValid: false, errors: ['Step plan must be an array of automation steps.'] };
  }

  if (steps.length === 0) {
    return { isValid: false, errors: ['Automation test plan cannot be empty. Add at least one step.'] };
  }

  if (steps.length > MAX_STEPS_ALLOWED) {
    return {
      isValid: false,
      errors: [`Step plan exceeds maximum limit of ${MAX_STEPS_ALLOWED} steps. Currently has ${steps.length} steps.`],
    };
  }

  const allowedTypes = new Set(allowedBlocks.map((b) => b.blockType));
  const stepIds = new Set<string>();

  steps.forEach((step, index) => {
    const stepLabel = `Step ${index + 1}`;

    if (!step.id || step.id.trim() === '') {
      errors.push(`${stepLabel}: Missing unique step ID.`);
    } else if (stepIds.has(step.id)) {
      errors.push(`${stepLabel}: Duplicate step ID "${step.id}".`);
    } else {
      stepIds.add(step.id);
    }

    if (!step.blockType || !allowedTypes.has(step.blockType)) {
      errors.push(`${stepLabel}: Block type "${step.blockType}" is not allowed in this exercise.`);
      return;
    }

    const def = allowedBlocks.find((b) => b.blockType === step.blockType) || BUILTIN_BLOCK_DEFINITIONS[step.blockType];
    if (def) {
      def.parameters.forEach((param) => {
        const val = step.params?.[param.id];
        if (param.required) {
          if (val === undefined || val === null || String(val).trim() === '') {
            errors.push(`${stepLabel} (${def.name}): Parameter "${param.label}" is required.`);
          }
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
