/**
 * Domain Constraints & Content Classification Constants
 * Unified reference for content lifecycle, sandbox runners and categories.
 */

export const CONTENT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  IN_REVIEW: 'in_review',
  CHANGES_REQUESTED: 'changes_requested',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  REJECTED: 'rejected',
} as const;

export type ContentStatusType = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];

export const SANDBOX_TYPES = {
  JS_WORKER: 'js_worker',
  SQL_WORKER: 'sql_worker',
  QUIZLET: 'quizlet',
  DOCKER: 'docker',
  API_MOCK: 'api_mock',
} as const;

export type SandboxType = (typeof SANDBOX_TYPES)[keyof typeof SANDBOX_TYPES];

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

export type DifficultyLevelType = (typeof DIFFICULTY_LEVELS)[keyof typeof DIFFICULTY_LEVELS];

export const TOPIC_CATEGORIES = {
  TESTING: 'testing',
  DATABASE: 'database',
  BACKEND: 'backend',
  DEVOPS: 'devops',
  SECURITY: 'security',
} as const;

export type TopicCategoryType = (typeof TOPIC_CATEGORIES)[keyof typeof TOPIC_CATEGORIES];
