// ─── Lab & Series domain types ───────────────────────────────────────────────
// Aligned with DB schema: lab_series, labs, lab_submissions, user_progress

export type SandboxType = 'js_worker' | 'sql_worker' | 'quizlet' | 'ui_mock' | 'api_mock' | 'markdown_only';
export type LabStatus = 'passed' | 'failed' | 'in_progress' | 'not_started';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
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
  expectedQueryResult?: Array<Record<string, unknown>>;
  config?: Partial<SqlLabConfig>;
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
  config?: any;
  envelope?: LabContentEnvelope;
  series?: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    isProOnly?: boolean;
  };
}

// ─── Automation Test Step & Config V1 ─────────────────────────────────────────
export interface AutomationTestStep {
  id: string;
  name: string;
  description?: string;
  action: 'click' | 'fill' | 'navigate' | 'assert_text' | 'assert_visible' | 'request';
  target?: string;
  value?: string;
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

// ─── Lab Content Contract V2 (Smart Cloze / Smart Cloaked Code) ──────────────
export type AutomationInteractionMode = 'smart_cloze' | 'guided_code' | 'full_code';

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
      version: '1.0' | '2.0';
      sandboxType: 'js_worker';
      instructions: string;
      initialSnippet: string;
      testScript: string;
      solution?: string;
      config?: AutomationTestConfig | AutomationExerciseV2;
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
    };

export type LabContentEnvelope = LabContentEnvelopeV1;

// ─── Submission payload ───────────────────────────────────────────────────────
export interface SubmitLabPayload {
  submittedCode: string;
  status: 'passed' | 'failed';
  timeMs: number;
  testLogs?: string;
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

// ─── Worker execution result ─────────────────────────────────────────────────
export interface WorkerTestCase {
  name: string;
  passed: boolean;
  message?: string;
}

export interface WorkerResult {
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
