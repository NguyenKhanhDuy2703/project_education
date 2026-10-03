import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types/user.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialToken = localStorage.getItem('access_token');

const initialState: AuthState = {
  user: null,
  accessToken: initialToken,
  isAuthenticated: Boolean(initialToken),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload.accessToken);
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload);
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('access_token');
    },
  },
});

export const { setAuth, setToken, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
