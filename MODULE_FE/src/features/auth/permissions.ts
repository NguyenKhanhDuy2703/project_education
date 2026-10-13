import type { AccessPlan, PermissionCode, User, UserGroup } from '@/types/user.types';
import { useAppSelector } from '@/stores/store';

export const PERMISSIONS = {
  // Content Authoring
  TOPIC_CREATE: 'CONTENT_TOPIC_CREATE',
  SERIES_CREATE: 'CONTENT_SERIES_CREATE',
  LAB_CREATE: 'CONTENT_LAB_CREATE',
  EDIT_OWN: 'CONTENT_EDIT_OWN',
  SUBMIT_REVIEW: 'CONTENT_SUBMIT_REVIEW',

  // Content Administration & Review
  REVIEW: 'CONTENT_REVIEW',
  PUBLISH: 'CONTENT_PUBLISH',
  EDIT_ALL: 'CONTENT_EDIT_ALL',
  TRANSFER_OWNERSHIP: 'CONTENT_TRANSFER_OWNERSHIP',
  ARCHIVE: 'CONTENT_ARCHIVE',

  // Learning Access
  LAB_BASIC: 'LAB_BASIC',
  LAB_PRO: 'LAB_PRO',
  SOLUTION_ACCESS: 'SOLUTION_ACCESS',
  SERIES_PUBLIC: 'SERIES_PUBLIC',

  // System Administration
  USER_MANAGE: 'USER_MANAGE',
  GROUP_MANAGE: 'GROUP_MANAGE',
  PLAN_MANAGE: 'PLAN_MANAGE',
  SYSTEM_VIEW: 'SYSTEM_VIEW',
} as const satisfies Record<string, PermissionCode>;

// Default role permissions (fallback when groups are not initialized)
const DEFAULT_ROLE_PERMISSIONS: Record<User['role'], PermissionCode[]> = {
  user: ['SERIES_PUBLIC', 'LAB_BASIC'],
  userPro: ['SERIES_PUBLIC', 'LAB_BASIC', 'LAB_PRO', 'SOLUTION_ACCESS'],
  contributor: [
    'SERIES_PUBLIC',
    'LAB_BASIC',
    'CONTENT_TOPIC_CREATE',
    'CONTENT_SERIES_CREATE',
    'CONTENT_LAB_CREATE',
    'CONTENT_EDIT_OWN',
    'CONTENT_SUBMIT_REVIEW',
  ],
  admin: [
    'CONTENT_TOPIC_CREATE',
    'CONTENT_SERIES_CREATE',
    'CONTENT_LAB_CREATE',
    'CONTENT_EDIT_OWN',
    'CONTENT_SUBMIT_REVIEW',
    'CONTENT_REVIEW',
    'CONTENT_PUBLISH',
    'CONTENT_EDIT_ALL',
    'CONTENT_TRANSFER_OWNERSHIP',
    'CONTENT_ARCHIVE',
    'LAB_BASIC',
    'LAB_PRO',
    'SOLUTION_ACCESS',
    'SERIES_PUBLIC',
    'USER_MANAGE',
    'GROUP_MANAGE',
    'PLAN_MANAGE',
    'SYSTEM_VIEW',
  ],
};

/**
 * Resolves effective permissions by computing the union of all permissions
 * across all active plans assigned to all active groups the user belongs to.
 */
export function resolveEffectivePermissions(
  user: User | null | undefined,
  groups: UserGroup[] = [],
  plans: AccessPlan[] = []
): Set<PermissionCode> {
  if (!user) return new Set();

  const effective = new Set<PermissionCode>();

  // If user object already carries pre-computed effective permissions, include them
  if (user.effectivePermissions && Array.isArray(user.effectivePermissions)) {
    user.effectivePermissions.forEach((p) => effective.add(p));
  }

  // 1. Filter active groups where user is a member
  const userGroups = groups.filter(
    (g) =>
      g.isActive &&
      (user.groupIds?.includes(g.id) || g.memberIds.includes(user.id))
  );

  // 2. Collect unique plan IDs from active user groups
  const activePlanIds = new Set<string>();
  userGroups.forEach((g) => {
    g.planIds.forEach((pid) => activePlanIds.add(pid));
  });

  // 3. Union all permissions from these active plans
  const userPlans = plans.filter((p) => p.isActive && activePlanIds.has(p.id));
  userPlans.forEach((p) => {
    p.permissionCodes.forEach((code) => effective.add(code));
  });

  // 4. Fallback to default role permissions if no group grants exist
  if (effective.size === 0 && DEFAULT_ROLE_PERMISSIONS[user.role]) {
    DEFAULT_ROLE_PERMISSIONS[user.role].forEach((code) => effective.add(code));
  }

  return effective;
}

export interface PermissionContext {
  authorId?: string;
}

/**
 * Check whether a user has a specific permission, considering resource ownership.
 */
export function can(
  user: User | null | undefined,
  permission: PermissionCode,
  context?: PermissionContext
): boolean {
  if (!user) return false;

  // Resolve user's active permissions (uses pre-computed set if available, else role fallback)
  const permissions =
    user.effectivePermissions && Array.isArray(user.effectivePermissions)
      ? new Set(user.effectivePermissions)
      : resolveEffectivePermissions(user);

  // Super-admin override for content edit: CONTENT_EDIT_ALL bypasses author check
  if (
    (permission === 'CONTENT_EDIT_OWN' || permission === 'CONTENT_LAB_CREATE') &&
    permissions.has('CONTENT_EDIT_ALL')
  ) {
    return true;
  }

  // Resource-level check for CONTENT_EDIT_OWN
  if (permission === 'CONTENT_EDIT_OWN') {
    if (!permissions.has('CONTENT_EDIT_OWN')) return false;
    // If authorId context is provided, enforce ownership
    if (context?.authorId) {
      return context.authorId === user.id;
    }
    return true;
  }

  return permissions.has(permission);
}

/**
 * React hook to check permissions in components
 */
export function usePermission(
  permission: PermissionCode,
  context?: PermissionContext
): boolean {
  const user = useAppSelector((state) => state.auth.user);
  return can(user, permission, context);
}

/**
 * Danh mục toàn bộ 18 Permission codes kèm metadata phục vụ UI Checkbox / Matrix
 */
export const ALL_PERMISSIONS = [
  // Content Authoring
  { code: 'CONTENT_TOPIC_CREATE', name: 'Create Topic', description: 'Allow creating new learning categories and topics', module: 'content' },
  { code: 'CONTENT_SERIES_CREATE', name: 'Create Series', description: 'Allow creating new practice series', module: 'content' },
  { code: 'CONTENT_LAB_CREATE', name: 'Create Lab', description: 'Allow authoring new practice labs', module: 'content' },
  { code: 'CONTENT_EDIT_OWN', name: 'Edit Own Content', description: 'Only edit content created by oneself', module: 'content' },
  { code: 'CONTENT_SUBMIT_REVIEW', name: 'Submit For Review', description: 'Submit draft content to Admin review queue', module: 'content' },

  // Content Administration & Review
  { code: 'CONTENT_REVIEW', name: 'Review Content', description: 'Review, score, approve, or request revisions on submitted content', module: 'content' },
  { code: 'CONTENT_PUBLISH', name: 'Publish Content', description: 'Formally publish content to the public learning catalog', module: 'content' },
  { code: 'CONTENT_EDIT_ALL', name: 'Edit All Content', description: 'Administrative permission to modify any content in the platform', module: 'content' },
  { code: 'CONTENT_TRANSFER_OWNERSHIP', name: 'Transfer Content Ownership', description: 'Reassign author ownership of content to another contributor', module: 'content' },
  { code: 'CONTENT_ARCHIVE', name: 'Archive Content', description: 'Archive or hide published content', module: 'content' },

  // Learning Access
  { code: 'SERIES_PUBLIC', name: 'Browse Series Catalog', description: 'Access and view public series catalog', module: 'learning' },
  { code: 'LAB_BASIC', name: 'Access Free Labs', description: 'Unlock and practice free/starter labs', module: 'learning' },
  { code: 'LAB_PRO', name: 'Access Pro Labs', description: 'Unlock all advanced Pro-tier labs', module: 'learning' },
  { code: 'SOLUTION_ACCESS', name: 'View Reference Solutions', description: 'View reference code solutions and explanations', module: 'learning' },

  // System Administration
  { code: 'USER_MANAGE', name: 'Manage Users', description: 'Manage user directory, activate, or suspend accounts', module: 'users' },
  { code: 'GROUP_MANAGE', name: 'Manage Groups (IAM)', description: 'Create/edit groups and attach plans to groups', module: 'access' },
  { code: 'PLAN_MANAGE', name: 'Manage Plans & Entitlements', description: 'Create/edit subscription plans and attach permission codes', module: 'access' },
  { code: 'SYSTEM_VIEW', name: 'View System Logs & Audit', description: 'Inspect system logs and audit trail', module: 'access' },
] as const;
