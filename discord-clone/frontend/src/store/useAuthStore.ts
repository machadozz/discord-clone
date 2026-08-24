import { create } from 'zustand';
import api from '../lib/axios';
import { connectSocket, disconnectSocket } from '../lib/socket';

export interface User {
  id: string;
  username: string;
  discriminator: string;
  email: string;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  isVerified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUserAvatar: (avatarUrl: string) => void;
  updateUserBanner: (bannerUrl: string) => void;
  verifyEmail: (email: string, code: string) => Promise<any>;
  resendVerification: (email: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<any>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: (accessToken, refreshToken, user) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    connectSocket(accessToken);
    set({ token: accessToken, refreshToken, user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      disconnectSocket();
      set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
    }
  },

  updateUserAvatar: (avatarUrl: string) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },

  updateUserBanner: (bannerUrl: string) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, bannerUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      connectSocket(token);
      const res = await api.get('/auth/me');
      if (res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
        set({ user: res.data, isAuthenticated: true });
      }
    } catch (error) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        set({ user: JSON.parse(storedUser), isAuthenticated: true });
      }
    }
  },

  verifyEmail: async (email, code) => {
    const res = await api.post('/auth/verify-email', { email, code });
    if (res.data.accessToken) {
      get().login(res.data.accessToken, res.data.refreshToken, res.data.user);
    }
    return res.data;
  },

  resendVerification: async (email) => {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (email, token, newPassword) => {
    const res = await api.post('/auth/reset-password', { email, token, newPassword });
    return res.data;
  },
}));
