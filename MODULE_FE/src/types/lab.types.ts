// ─── Lab & Series domain types ───────────────────────────────────────────────
// Aligned with DB schema: lab_series, labs, lab_submissions, user_progress

export type SandboxType = 'js_worker' | 'sql_worker' | 'quizlet' | 'ui_mock' | 'api_mock' | 'markdown_only';
export type LearningUnitType = 'theory' | 'sql_practice' | 'quiz_checkpoint' | 'automation_lab';
export type LearningProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type LabStatus = 'passed' | 'failed' | 'in_progress' | 'not_started';

export interface FormativeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
  hint?: string;
}

export interface TheoryLessonConfig {
  version?: '1.0' | '3.0';
  readingTimeMinutes?: number;
  objectives?: string[];
  formativeQuestions?: FormativeQuestion[];
}

export interface SeriesSection {
  id: string;
  seriesId: string;
  title: string;
  description?: string;
  orderIndex: number;
  labs?: LabSummary[] | PracticeLabV1[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningUnitProgress {
  id: string;
  userId: string;
  labId: string;
  status: LearningProgressStatus;
  lastPosition?: Record<string, any> | null;
  score?: number | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  hint?: string;
}

export type ContentLifecycleStatus =
  | 'draft'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived';

export interface ReviewFeedback {
  id: string;
  reviewerId: string;
  reviewerName?: string;
  status: 'changes_requested' | 'approved' | 'rejected';
  comment: string;
  createdAt: string;
}

// ─── Series (lab_series table) ────────────────────────────────────────────────
export interface LabSeries {
  id: string;
  slug: string;
  title: string;
  description: string;
  category?: string;
  formatType?: SandboxType;
  topic?: string;        // e.g. "testing", "backend", "docker"
  level: 'beginner' | 'intermediate' | 'advanced';
  isProOnly: boolean;
  authorId?: string;
  authorName?: string;
  status?: ContentLifecycleStatus;
  version?: string;
  reviewFeedback?: string;
  totalLabs?: number;
  estimatedMinutes?: number;
  coverEmoji?: string;
  orderIndex?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  // FE-joined fields
  labs?: LabSummary[];
  sections?: SeriesSection[];
  userProgress?: SeriesProgress;
  _count?: { labs: number };
}

export interface CreateSeriesInput {
  title: string;
  slug?: string;
  category: string;
  formatType?: SandboxType;
  description: string;
  level?: string;
  coverEmoji?: string;
  repoUrl?: string;
  swaggerUrl?: string;
  orderIndex?: number;
  isProOnly?: boolean;
  isActive?: boolean;
}

export interface CreateLabInput {
  seriesId: string;
  title: string;
  slug?: string;
  sandboxType?: string;
  unitType?: LearningUnitType;
  sectionId?: string;
  objective?: string;
  instructions: string;
  initialSnippet?: string;
  testScript?: string;
  solution?: string;
  durationMinutes?: number;
  isFreePreview?: boolean;
  isProOnly?: boolean;
  orderIndex?: number;
  isActive?: boolean;
  sqlSchema?: string;
  sampleData?: Array<Record<string, unknown>>;
  quizQuestions?: QuizQuestion[];
}

// ─── Lab summary (card view, no heavy content) ───────────────────────────────
export interface LabSummary {
  id: string;
  seriesId: string;
  slug: string;
  title: string;
  order: number;
  isProOnly: boolean;
  isFreePreview?: boolean;
  sandboxType: SandboxType;
  unitType?: LearningUnitType;
  sectionId?: string;
  section?: SeriesSection;
  progress?: LearningUnitProgress;
  estimatedMinutes?: number;
  durationMinutes?: number;
  authorId?: string;
  authorName?: string;
  status?: ContentLifecycleStatus;
  version?: string;
  reviewFeedback?: string;
  // Joined from user_progress
  userStatus?: LabStatus;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  completionCount?: number;
}

// ─── Lab detail (workspace view, full content) ────────────────────────────────
export interface LabDetail extends LabSummary {
  objective?: string;         // Learning objective or serialized metadata
  instructions: string;       // Markdown content
  initialSnippet: string;     // Starter code loaded into Monaco Editor
  testScript: string;         // Injected into Web Worker alongside user code
  solution?: string;          // Model solution (for Pro/Admin)
  sqlSchema?: string;         // Schema for SQL sandbox
  sampleData?: Array<Record<string, unknown>>; // Mock rows for SQL
  expectedQueryResult?: Array<Record<string, unknown>>; // Target query result rows
  quizQuestions?: QuizQuestion[]; // For quizlet mode
  quizList?: QuizQuestion[]; // Alias for quizQuestions
  isLocked?: boolean;
  lockReason?: string;
  durationMinutes?: number;
  series?: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    isProOnly?: boolean;
  };
}

// ─── Lab Content Contract V1 (Discriminated by sandboxType) ───────────────────
export interface AutomationTestStep {
  id: string;
  name: string;
  description?: string;
  matcher: 'toBe' | 'toEqual' | 'toBeDefined' | 'toContain';
  expected?: any;
  hint?: string;
}

export interface AutomationTestConfig {
  version: '1.0';
  targetFunction?: string;
  steps?: AutomationTestStep[];
  cheatSheetVisible?: boolean;
}

// ─── Lab Content Contract V2 & V3 (Smart Cloze / Low-Code Block Builder) ──────
export type AutomationMode =
  | 'block_builder'
  | 'smart_cloze'
  | 'guided_code'
  | 'full_code';

export type AutomationInteractionMode = AutomationMode;

export type BlankKind =
  | 'http_status'
  | 'expected_value'
  | 'matcher'
  | 'action'
  | 'selector'
  | 'path'
  | 'method'
  | 'text'
  | 'number'
  | 'boolean';

export type BlankValueType = 'string' | 'number' | 'boolean' | 'json' | 'enum';

export interface TypedOption {
  value: string | number | boolean;
  label: string;
  description?: string;
}

export interface BlankValidationRule {
  type: 'min' | 'max' | 'regex' | 'enum' | 'custom' | 'required';
  value?: any;
  message: string;
}

export interface BlankDefinition {
  id: string; // stable across edits and analytics
  kind: BlankKind;
  label: string;
  required?: boolean;
  valueType: BlankValueType;
  placeholder?: string;
  defaultValue?: any;
  options?: TypedOption[];
  validation?: BlankValidationRule[];
  hintIds?: string[];
  conceptTags?: string[];
  helperText?: string;
}

export type TemplateSegment =
  | { kind: 'readonly'; text: string }
  | { kind: 'managed'; label: string; summary?: string; code?: string }
  | { kind: 'blank'; blankId: string };

export interface AutomationPublicCheck {
  id: string;
  name: string;
  description?: string;
  blankId?: string;
  conceptTag?: string;
  ruleType?: string;
  targetBlockType?: string;
  expectedParamValue?: Record<string, any>;
  hint?: string;
}

export interface AutomationGradingRule {
  blankId: string;
  acceptedValues?: any[];
  pattern?: string;
  feedback?: string;
}

export interface AutomationExerciseV2 {
  version: '2.0';
  interactionMode: AutomationInteractionMode;
  framework?: 'playwright' | 'api' | 'generic';
  publicTemplate: TemplateSegment[];
  blanks: BlankDefinition[];
  publicChecks?: AutomationPublicCheck[];
  gradingRules?: AutomationGradingRule[];
  targetFunction?: string;
  cheatSheetVisible?: boolean;
}

// ─── Playwright Automation V3 Contract (Task 1 / Contract V3) ─────────────────
export type BlockCategory = 'navigation' | 'locator' | 'action' | 'assertion' | 'data';

export type AllowedLocatorKind =
  | 'getByRole'
  | 'getByLabel'
  | 'getByText'
  | 'getByTestId'
  | 'filter';

export type AllowedActionKind =
  | 'goto'
  | 'fill'
  | 'click'
  | 'check'
  | 'selectOption';

export type AllowedAssertionKind =
  | 'toBeVisible'
  | 'toHaveText'
  | 'toHaveValue'
  | 'toHaveCount'
  | 'toHaveURL';

export interface AutomationBlockParameter {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'role';
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface AutomationBlockDefinition {
  blockType: string;
  category: BlockCategory;
  name: string;
  description: string;
  codePattern: string;
  parameters: AutomationBlockParameter[];
  maxCountPerTest?: number;
}

export interface AutomationStep {
  id: string;
  blockType: string;
  category: BlockCategory;
  params: Record<string, any>;
  comment?: string;
  isLocked?: boolean;
}

export interface AutomationGradingRuleV3 {
  checkId: string;
  requiredSteps?: Array<{
    blockType: string;
    paramsMatch?: Record<string, any>;
  }>;
  forbiddenPatterns?: string[];
  feedback?: string;
}

export interface AutomationGradingKeyV3 {
  exerciseRevision: string;
  expectedStepCount?: number;
  requiredSteps?: Array<{
    type?: string;
    action?: string;
    matcher?: string;
    locatorType?: string;
    target?: string;
    expected?: any;
    paramsMatch?: Record<string, any>;
  }>;
  forbiddenPatterns?: string[];
  minScore?: number;
}

export interface AutomationSubmissionPayloadV3 {
  version: '3.0';
  exerciseRevision: string;
  stepPlan: AutomationStep[];
  answers?: Record<string, any>;
  generatedPlaywrightCode: string;
  resultSummary: {
    passed: boolean;
    passedChecks: string[];
    totalChecks: number;
    durationMs: number;
  };
  durationMs: number;
}

export interface AutomationExerciseV3 {
  version: '3.0';
  framework: 'playwright';
  interactionMode: AutomationMode;
  contentRevision: string;
  fixture: {
    fixtureId: string;
    fixtureVersion: string;
    initialRoute: string;
    initialState?: Record<string, unknown>;
  };
  allowedBlocks: AutomationBlockDefinition[];
  starterPlan: AutomationStep[];
  publicChecks: AutomationPublicCheck[];
  gradingRules?: AutomationGradingRuleV3[];
  gradingKey?: AutomationGradingKeyV3;
  exportTemplate: 'typescript' | 'javascript';
  targetFunction?: string;
  title?: string;
  scenarioDescription?: string;
}

// ─── Playwright Parameterized Scenario Contract (Subtask 4.1 / DEC-08) ────────
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

export interface PlaywrightParameterizedExerciseConfig {
  version: '2.0';
  interactionMode: 'parameterized_scenarios' | 'smart_cloze';
  framework: 'playwright';
  scenarios: PlaywrightParameterizedScenario[];
}

export interface SqlLabConfig {
  version: '1.0' | '2.0';
  schemaSql: string;
  seedSql?: string;
  expectedQueryResult?: Array<Record<string, unknown>>;
  expectedColumns?: string[];
  verificationSql?: string;
  orderSensitive?: boolean;
  sampleRowsVisible?: boolean;
  statementPolicy?: 'read_only' | 'mutable';
  timeoutMs?: number;
  maxResultRows?: number;
  maxResultColumns?: number;
}

export interface QuizQuestionV1 {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  hint?: string;
}

export interface QuizLabConfig {
  version: '1.0';
  questions: QuizQuestionV1[];
  allowReviewBeforeSubmit?: boolean;
  passPercentage?: number;
}

export type LabContentEnvelopeV1 =
  | {
      version: '1.0' | '2.0' | '3.0';
      sandboxType: 'js_worker';
      instructions: string;
      initialSnippet: string;
      testScript: string;
      solution?: string;
      config?: AutomationTestConfig | AutomationExerciseV2 | AutomationExerciseV3;
    }
  | {
      version: '1.0' | '2.0';
      sandboxType: 'sql_worker';
      instructions: string;
      initialSnippet: string;
      testScript?: string;
      solution?: string;
      config: SqlLabConfig;
    }
  | {
      version: '1.0';
      sandboxType: 'quizlet';
      instructions: string;
      initialSnippet?: string;
      testScript?: string;
      solution?: string;
      config: QuizLabConfig;
    }
  | {
      version?: '1.0' | '3.0';
      sandboxType: 'markdown_only';
      instructions: string;
      initialSnippet?: string;
      testScript?: string;
      solution?: string;
      config?: TheoryLessonConfig;
    };

export type LabContentEnvelope = LabContentEnvelopeV1;

export type PracticeLabV1 = LabSummary & {
  envelope: LabContentEnvelope;
  isLocked?: boolean;
  lockReason?: string;
};


// ─── Submission payload ───────────────────────────────────────────────────────
export interface SubmitLabPayload {
  submittedCode: string;
  status: 'passed' | 'failed';
  timeMs: number;
  testLogs?: string;
  answers?: Record<string, any>;
  templateVersion?: string;
  payloadV3?: AutomationSubmissionPayloadV3;
}

export interface SubmitLabResult {
  message: string;
  id: string;
  labId: string;
  userId: string;
  status: 'passed' | 'failed';
  timeMs: number;
  createdAt: string;
  review?: {
    isPassed?: boolean;
    passed?: boolean;
    scorePercentage?: number;
    correctCount?: number;
    passedQuestionsCount?: number;
    totalQuestions?: number;
    details?: Array<{
      questionId: string;
      selectedOptionIndex: number | null;
      correctOptionIndex: number;
      isCorrect: boolean;
      explanation?: string;
    }>;
  };
}

export interface LabSubmissionRecord {
  id: string;
  labId: string;
  userId: string;
  submittedCode: string;
  status: 'passed' | 'failed';
  executionTimeMs: number;
  testLogs?: string;
  createdAt: string;
}

export interface UserLabSubmissionItem extends LabSubmissionRecord {
  lab?: {
    id: string;
    title: string;
    slug: string;
    difficulty?: string;
    sandboxType: string;
    durationMinutes?: number;
    series?: {
      id: string;
      title: string;
      slug: string;
      category?: string;
      topic?: string;
      level?: string;
    };
  };
}

// ─── Worker execution result ─────────────────────────────────────────────────
export interface WorkerTestCase {
  name: string;
  passed: boolean;
  message?: string;
  expected?: any;
  actual?: any;
  hint?: string;
  executionTimeMs?: number;
  stepId?: string;
  matcher?: string;
  diff?: string;
}

export interface WorkerResult {
  protocolVersion?: '1.0';
  passed: boolean;
  timeMs: number;
  testCases: WorkerTestCase[];
  logs: string[];
  error?: string;
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  totalCompleted: number;
  totalLabs: number;
  streakDays: number;
  seriesProgress: SeriesProgress[];
}

export interface SeriesProgress {
  seriesId: string;
  seriesTitle: string;
  completedLabs: number;
  totalLabs: number;
  percentComplete: number;
}
