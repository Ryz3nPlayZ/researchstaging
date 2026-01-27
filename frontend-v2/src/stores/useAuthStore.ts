/**
 * Authentication State Management
 *
 * Manages user authentication state, including user data,
 * authentication status, and auth tokens.
 */

import { create } from 'zustand';
import type { User } from '../types/api';

interface AuthState {
  // Authentication state
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;

  // Reset store to initial state
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  token: null,

  // Actions
  login: async (email, password) => {
    // TODO: Implement API call to authenticate
    // This will be implemented when backend API is available
    // Example implementation:
    // const response = await fetch('/api/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password }),
    // });
    // const data = await response.json();
    // localStorage.setItem('auth_token', data.token);
    // set({
    //   user: data.user,
    //   token: data.token,
    //   isAuthenticated: true,
    // });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({
      user: null,
      isAuthenticated: false,
      token: null,
    });
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  setToken: (token) => {
    localStorage.setItem('auth_token', token);
    set({ token });
  },

  reset: () =>
    set({
      user: null,
      isAuthenticated: false,
      token: null,
    }),
}));
