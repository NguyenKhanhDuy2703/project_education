import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types/user.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialToken = localStorage.getItem('access_token');
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
  isAuthenticated: Boolean(initialToken),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      const normalizedUser = {
        ...action.payload.user,
        role: action.payload.user.role || 'user',
      };
      state.user = normalizedUser;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload.accessToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload);
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
      state.isAuthenticated = false;
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    },
  },
});

export const { setAuth, setToken, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
