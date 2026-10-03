import type { AuthResponse } from '@/types/user.types';

/** Danh sách tài khoản test — chỉ dùng khi VITE_USE_MOCK=true */
const MOCK_ACCOUNTS: Record<string, AuthResponse> = {
  'user@test.com': {
    accessToken: 'mock-access-token-user',
    user: {
      id: 'mock-user-001',
      name: 'Nguyễn Văn Test',
      email: 'user@test.com',
      phone: '0900000001',
      role: 'user',
      avatarUrl: null,
      defaultAddress: null,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
  },
  'pro@test.com': {
    accessToken: 'mock-access-token-pro',
    user: {
      id: 'mock-user-002',
      name: 'Trần Thị Pro',
      email: 'pro@test.com',
      phone: '0900000002',
      role: 'userPro',
      avatarUrl: null,
      defaultAddress: null,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
  },
  'admin@test.com': {
    accessToken: 'mock-access-token-admin',
    user: {
      id: 'mock-user-003',
      name: 'Admin System',
      email: 'admin@test.com',
      phone: '0900000003',
      role: 'admin',
      avatarUrl: null,
      defaultAddress: null,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
  },
};

/** Mật khẩu chung cho mọi tài khoản test */
const MOCK_PASSWORD = 'Test@123';

export function mockLogin(phoneOrEmail: string, password: string): AuthResponse {
  if (password !== MOCK_PASSWORD) {
    throw new Error('Sai mật khẩu. Mật khẩu test: Test@123');
  }
  const account = MOCK_ACCOUNTS[phoneOrEmail.trim().toLowerCase()];
  if (!account) {
    throw new Error('Tài khoản không tồn tại trong danh sách mock.');
  }
  return account;
}

export function mockGetCurrentUser(token: string) {
  const account = Object.values(MOCK_ACCOUNTS).find(
    (a) => a.accessToken === token
  );
  if (!account) throw new Error('Invalid mock token');
  return account.user;
}
