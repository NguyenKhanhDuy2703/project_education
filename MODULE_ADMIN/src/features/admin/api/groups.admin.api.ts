import { apiClient } from '@/services/api.client';
import type { UserGroup } from '@/types/user.types';

export interface CreateGroupPayload {
  name: string;
  code: string;
  description?: string;
  planIds?: string[];
  isActive?: boolean;
}

export interface UpdateGroupPayload {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export const adminGroupsApi = {
  getAll: async (): Promise<UserGroup[]> => {
    const res = await apiClient.get<any>('/admin/groups');
    return res.data?.data || res.data || [];
  },

  getById: async (id: string): Promise<UserGroup> => {
    const res = await apiClient.get<any>(`/admin/groups/${id}`);
    return res.data?.data || res.data;
  },

  create: async (payload: CreateGroupPayload): Promise<UserGroup> => {
    const res = await apiClient.post<any>('/admin/groups', payload);
    return res.data?.data || res.data;
  },

  update: async (id: string, payload: UpdateGroupPayload): Promise<UserGroup> => {
    const res = await apiClient.put<any>(`/admin/groups/${id}`, payload);
    return res.data?.data || res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/groups/${id}`);
  },

  assignPlans: async (id: string, planIds: string[]): Promise<any> => {
    const res = await apiClient.post<any>(`/admin/groups/${id}/plans`, { planIds });
    return res.data?.data || res.data;
  },

  addMember: async (groupId: string, userId: string): Promise<any> => {
    const res = await apiClient.post<any>(`/admin/groups/${groupId}/members`, { userId });
    return res.data?.data || res.data;
  },

  removeMember: async (groupId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/admin/groups/${groupId}/members/${userId}`);
  },
};
