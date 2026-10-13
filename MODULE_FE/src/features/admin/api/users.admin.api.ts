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

export interface CreateUserInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
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
   * Create a new user account manually (Admin only).
   */
  createUser: async (data: CreateUserInput): Promise<AdminUserItem> => {
    const res = await apiClient.post<any>('/users', data);
    return res.data?.data ?? res.data;
  },

  /**
   * Update user details and role (Admin only).
   */
  updateUser: async (userId: string, data: UpdateUserInput): Promise<AdminUserItem> => {
    const res = await apiClient.put<any>(`/users/${userId}`, data);
    return res.data?.data ?? res.data;
  },

  /**
   * Soft-delete / deactivate a user account with protection checks (Admin only).
   */
  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
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
