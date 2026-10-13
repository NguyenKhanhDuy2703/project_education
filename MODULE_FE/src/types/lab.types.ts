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
  sandboxType: SandboxType;
  estimatedMinutes: number;
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
  quizQuestions?: QuizQuestion[]; // For quizlet mode
  isLocked?: boolean;
  lockReason?: string;
}

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
