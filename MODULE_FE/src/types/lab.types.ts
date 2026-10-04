// ─── Lab & Series domain types ───────────────────────────────────────────────
// Aligned with DB schema: lab_series, labs, lab_submissions, user_progress

export type SandboxType = 'js_worker' | 'ui_mock' | 'api_mock';
export type LabStatus = 'passed' | 'failed' | 'in_progress' | 'not_started';

// ─── Series (lab_series table) ────────────────────────────────────────────────
export interface LabSeries {
  id: string;
  slug: string;
  title: string;
  description: string;
  category?: string;
  topic?: string;        // e.g. "testing", "backend", "docker"
  level: 'beginner' | 'intermediate' | 'advanced';
  isProOnly: boolean;
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
  // Joined from user_progress
  userStatus?: LabStatus;
}

// ─── Lab detail (workspace view, full content) ────────────────────────────────
export interface LabDetail extends LabSummary {
  instructions: string;       // Markdown content
  initialSnippet: string;     // Starter code loaded into Monaco Editor
  testScript: string;         // Injected into Web Worker alongside user code
}

// ─── Submission payload ───────────────────────────────────────────────────────
export interface SubmitLabPayload {
  submittedCode: string;
  status: 'passed' | 'failed';
  timeMs: number;
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
