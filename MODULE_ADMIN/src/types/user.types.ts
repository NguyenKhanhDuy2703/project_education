export type UserRole = 'admin' | 'contributor' | 'user' | 'userPro';

export type PermissionCode =
  // Content Authoring
  | 'CONTENT_TOPIC_CREATE'
  | 'CONTENT_SERIES_CREATE'
  | 'CONTENT_LAB_CREATE'
  | 'CONTENT_EDIT_OWN'
  | 'CONTENT_SUBMIT_REVIEW'
  // Content Administration & Review
  | 'CONTENT_REVIEW'
  | 'CONTENT_PUBLISH'
  | 'CONTENT_EDIT_ALL'
  | 'CONTENT_TRANSFER_OWNERSHIP'
  | 'CONTENT_ARCHIVE'
  // Learning Access
  | 'LAB_BASIC'
  | 'LAB_PRO'
  | 'SOLUTION_ACCESS'
  | 'SERIES_PUBLIC'
  // System Administration
  | 'USER_MANAGE'
  | 'GROUP_MANAGE'
  | 'PLAN_MANAGE'
  | 'SYSTEM_VIEW';

export interface Permission {
  code: PermissionCode;
  name: string;
  description: string;
  module: 'content' | 'users' | 'access' | 'learning';
}

export interface AccessPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  permissionCodes: PermissionCode[];
  isActive: boolean;
  updatedAt?: string;
}

export interface UserGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
  planIds: string[];
  memberIds: string[];
  isActive: boolean;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string | null;
  phone?: string;
  role: UserRole;
  isContributor?: boolean;
  contributorStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  groupIds?: string[];
  effectivePermissions?: PermissionCode[];
  avatarUrl?: string | null;
  defaultAddress?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}
