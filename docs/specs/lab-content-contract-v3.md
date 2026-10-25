# Lab Content Contract Specification — V3.0 (Automation Low-Code & Playwright)

- **Version**: 3.0
- **Status**: Authoritative
- **Last Updated**: 2026-10-22
- **Author**: Nguyen Khanh Duy (Fullstack Lead & Architect)
- **Applicable Services**: `MODULE_BE` (Labs Module, DTOs, Validation), `MODULE_FE` (Lab Workspace Strategies, AST Compilers), `MODULE_ADMIN` (Lab Review & Studio)

---

## 1. Overview & Motivation

Contract V3.0 introduces a structured, declarative content model for **Low-Code Web Test Automation** powered by Playwright. It enables learners to progressively transition across three pedagogical tiers:
1. **Block Builder**: Assemble tests visually using drag/click palettes and structured form fields.
2. **Smart Cloze**: Fill critical blanks in pre-configured automation scripts (selectors, assertions, test inputs).
3. **Guided / Full Code**: Author and customize full Playwright TypeScript code side-by-side with visual timeline verification.

Contract V3 maintains 100% backward compatibility with V1 (code-based exercises) and V2 (parameterized low-code cloze).

---

## 2. Core Schema Definitions

### 2.1. `AutomationExerciseV3`

The root content object stored in `labs.content` for Automation V3 labs:

```typescript
type AutomationMode =
  | 'block_builder'
  | 'smart_cloze'
  | 'guided_code'
  | 'full_code';

interface AutomationExerciseV3 {
  version: '3.0';
  framework: 'playwright';
  interactionMode: AutomationMode;
  contentRevision: string; // e.g. "2026.10-rev1"
  fixture: AutomationFixtureConfig;
  allowedBlocks: AutomationBlockDefinition[];
  starterPlan: AutomationStep[];
  publicChecks: AutomationPublicCheck[];
  exportTemplate: 'typescript' | 'javascript';
  targetFunction?: string;
  gradingRules?: AutomationGradingRule[];
  gradingKey?: AutomationGradingKey; // Server-only, stripped for learners
}
```

### 2.2. Fixture Configuration (`AutomationFixtureConfig`)

Declares the internal sandboxed web application loaded into the iframe:

```typescript
interface AutomationFixtureConfig {
  fixtureId: string;       // e.g. "ecommerce-checkout", "auth-portal"
  fixtureVersion: string;  // e.g. "1.0.0"
  initialRoute: string;    // e.g. "/login", "/products"
  initialState?: Record<string, unknown>;
}
```

### 2.3. Block Definitions & Parameter Schemas

Defines the palette items permitted in the exercise:

```typescript
type BlockCategory = 'navigation' | 'locator' | 'action' | 'assertion' | 'data';

interface AutomationBlockParameter {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'role';
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface AutomationBlockDefinition {
  blockType: string;       // e.g. "goto", "getByRole", "click", "toBeVisible"
  category: BlockCategory;
  name: string;
  description: string;
  codePattern: string;     // Template e.g. "await page.goto('{url}');"
  parameters: AutomationBlockParameter[];
  maxCountPerTest?: number;
}
```

### 2.4. Step Plan (`AutomationStep`)

A declarative step in the learner's test scenario:

```typescript
interface AutomationStep {
  id: string;              // Unique UUID / step identifier
  blockType: string;       // Matches an allowed blockType
  category: BlockCategory;
  params: Record<string, any>;
  comment?: string;
  isLocked?: boolean;      // True for cloze/guided scenarios where step cannot be removed
}
```

### 2.5. Public Checks (`AutomationPublicCheck`)

Visible validation criteria presented in the workspace sidebar:

```typescript
interface AutomationPublicCheck {
  id: string;
  name: string;
  description?: string;
  conceptTag?: string;     // e.g. "locator-resilience", "web-first-assertion"
  ruleType?: string;       // e.g. "require_step", "assert_value"
  targetBlockType?: string;
  expectedParamValue?: Record<string, any>;
  hint?: string;
}
```

---

## 3. Server-Only Grading Key (`AutomationGradingKey`)

> [!IMPORTANT]
> The `gradingKey` object is **strictly confidential** and must be stripped by `labContentCodec` before transmitting lab details to learners. Only Platform Administrators and Content Authors may inspect this field.

```typescript
interface AutomationGradingRule {
  id: string;
  type: 'require_step' | 'forbid_pattern' | 'min_steps' | 'assert_order';
  targetBlockType?: string;
  paramMatches?: Record<string, any>;
  pattern?: string;
  errorMessage: string;
}

interface AutomationGradingKey {
  requiredSteps?: string[];
  forbiddenPatterns?: string[];
  minStepCount?: number;
  rules?: AutomationGradingRule[];
  solutionPlan?: AutomationStep[];
}
```

---

## 4. Versioned Submission Envelope (`AutomationSubmissionPayload`)

When a learner clicks **"Submit Lab"**, the frontend compiles and encodes a Base64 payload into the `submittedCode` string:

```typescript
interface AutomationSubmissionPayload {
  version: '3.0';
  framework: 'playwright';
  interactionMode: AutomationMode;
  exerciseRevision: string;
  stepPlan: AutomationStep[];
  answers: Record<string, string>;
  generatedPlaywrightCode: string;
  resultSummary: {
    passed: boolean;
    totalSteps: number;
    passedSteps: number;
    failedStepIndex?: number;
    failureReason?: string;
  };
  durationMs: number;
  submittedAt: string;
}
```

### Base64 Transport Format:
```text
eyJ2ZXJzaW9uIjoiMy4wIiwiZnJhbWV3b3JrIjoicGxheXdyaWdodCIsImV4ZXJjaXNlUmV2aXNpb24iOiIyMDI2LjEwLXJldjEiLCJzdGVwUGxhbiI6Wy4uLl19
```

The backend decoder (`AutomationV3Validator`) unpacks this payload, verifies:
1. `version === '3.0'`
2. `exerciseRevision === lab.content.contentRevision`
3. `stepPlan.length <= 50`
4. All `step.blockType` belong to `lab.content.allowedBlocks`
5. All rules in `lab.content.gradingKey` evaluate to `true`

---

## 5. Backward Compatibility Matrix

| Content Version | Interaction Mode | Parsing Strategy | Workspace Component |
|---|---|---|---|
| **V1.0** | Pure JS / Automation | Direct Monaco code runner | `AutomationTestWorkspace` |
| **V2.0** | Smart Cloze Parameterized | Slot template substitution | `AutomationTestWorkspace` |
| **V3.0** | Low-Code Block Builder | AST compiler + Iframe Sandbox | `AutomationV3Workspace` (Feature-flagged) |

When `AUTOMATION_V3_ENABLED=false`, the client cleanly falls back to `AutomationTestWorkspace` without throwing errors or breaking legacy labs.
