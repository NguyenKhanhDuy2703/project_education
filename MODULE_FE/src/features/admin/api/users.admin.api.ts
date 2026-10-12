import { apiClient } from '@/services/api.client';
import type { UserRole } from '@/types/user.types';

export interface AdminUserItem {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl: string | null;
  googleId: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface AdminUsersResponse {
  items: AdminUserItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const usersAdminApi = {
  /**
   * Fetch paginated users list with search and filter parameters (Admin only).
   */
  getUsers: async (params?: {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<AdminUsersResponse> => {
    const res = await apiClient.get<any>('/users', { params });
    return res.data?.data ?? res.data;
  },

  /**
   * Update user role / access level (Admin only).
   */
  updateRole: async (userId: string, role: UserRole): Promise<void> => {
    await apiClient.patch(`/users/${userId}/role`, { role });
  },

  /**
   * Activate or suspend a user account (Admin only).
   */
  updateStatus: async (userId: string, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/users/${userId}/status`, { isActive });
  },
};
