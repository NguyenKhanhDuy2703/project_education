/**
 * UI Constants & English Localization Labels
 * Consistent terminology across Student Portal, Contributor Workspace, and Admin Studio.
 */

import { CONTENT_STATUS, DIFFICULTY_LEVELS, SANDBOX_TYPES } from './content.constants';

export const STATUS_LABELS: Record<string, string> = {
  [CONTENT_STATUS.DRAFT]: 'Draft',
  [CONTENT_STATUS.SUBMITTED]: 'Submitted',
  [CONTENT_STATUS.IN_REVIEW]: 'In Review',
  [CONTENT_STATUS.CHANGES_REQUESTED]: 'Changes Requested',
  [CONTENT_STATUS.APPROVED]: 'Approved',
  [CONTENT_STATUS.PUBLISHED]: 'Published',
  [CONTENT_STATUS.ARCHIVED]: 'Archived',
  [CONTENT_STATUS.REJECTED]: 'Rejected',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  [DIFFICULTY_LEVELS.BEGINNER]: 'Beginner',
  [DIFFICULTY_LEVELS.INTERMEDIATE]: 'Intermediate',
  [DIFFICULTY_LEVELS.ADVANCED]: 'Advanced',
};

export const SANDBOX_LABELS: Record<string, string> = {
  [SANDBOX_TYPES.JS_WORKER]: 'JavaScript Worker',
  [SANDBOX_TYPES.SQL_WORKER]: 'SQL Runner',
  [SANDBOX_TYPES.QUIZLET]: 'Knowledge Quiz',
  [SANDBOX_TYPES.DOCKER]: 'Docker Container',
  [SANDBOX_TYPES.API_MOCK]: 'REST API Mock',
};

export const BREADCRUMB_DOMAINS = {
  HOME: 'Home',
  SERIES: 'Practice Series',
  LABS: 'Interactive Labs',
  ADMIN_STUDIO: 'Admin Studio',
  CONTRIBUTOR_STUDIO: 'Contributor Studio',
  CONTENT_STUDIO: 'Content Studio',
  REVIEW_QUEUE: 'Review Queue',
  IAM_GROUPS: 'IAM Groups & Plans',
  AUDIT_TRAIL: 'Audit Trail',
} as const;
