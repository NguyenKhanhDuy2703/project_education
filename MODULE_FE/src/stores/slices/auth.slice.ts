import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types/user.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const initialToken = localStorage.getItem('access_token');
const initialRefreshToken = localStorage.getItem('refresh_token');
const savedUser = localStorage.getItem('user');

let initialUser: User | null = null;
if (savedUser) {
  try {
    const parsed = JSON.parse(savedUser);
    initialUser = {
      ...parsed,
      role: parsed.role || 'user',
    };
  } catch {
    initialUser = null;
  }
}

const initialState: AuthState = {
  user: initialUser,
  accessToken: initialToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: Boolean(initialToken),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken?: string | null }>
    ) => {
      const normalizedUser = {
        ...action.payload.user,
        role: action.payload.user.role || 'user',
      };
      state.user = normalizedUser;
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken !== undefined) {
        state.refreshToken = action.payload.refreshToken;
        if (action.payload.refreshToken) {
          localStorage.setItem('refresh_token', action.payload.refreshToken);
        } else {
          localStorage.removeItem('refresh_token');
        }
      }
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload.accessToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    },
    setTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken?: string | null }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload.accessToken);
      if (action.payload.refreshToken !== undefined) {
        state.refreshToken = action.payload.refreshToken;
        if (action.payload.refreshToken) {
          localStorage.setItem('refresh_token', action.payload.refreshToken);
        } else {
          localStorage.removeItem('refresh_token');
        }
      }
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload);
    },
    setRefreshToken: (state, action: PayloadAction<string | null>) => {
      state.refreshToken = action.payload;
      if (action.payload) {
        localStorage.setItem('refresh_token', action.payload);
      } else {
        localStorage.removeItem('refresh_token');
      }
    },
    setUser: (state, action: PayloadAction<User>) => {
      const normalizedUser = {
        ...action.payload,
        role: action.payload.role || 'user',
      };
      state.user = normalizedUser;
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    },
  },
});

export const { setAuth, setTokens, setToken, setRefreshToken, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
