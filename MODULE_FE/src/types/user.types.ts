export type UserRole = 'admin' | 'user' | 'userPro';

export interface User {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  role: UserRole;
  avatarUrl?: string | null;
  defaultAddress?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}
