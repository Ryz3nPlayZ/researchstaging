// Authentication utilities for frontend3
// Mock authentication for local development (Google OAuth preserved in backend)

export interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
}

export interface Session {
  user: User;
  token: string;
}

/**
 * Mock login function for local development
 * Auto-creates test user for development without OAuth
 */
export const login = async (): Promise<Session> => {
  // For local development, auto-create test user
  const testUser: User = {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    credits: 1000,
  };

  const token = `mock-jwt-${Date.now()}`;

  const session: Session = { user: testUser, token };

  // Persist to localStorage
  localStorage.setItem('user_session', JSON.stringify(session));

  return session;
};

/**
 * Logout function
 * Clears session from localStorage
 */
export const logout = (): void => {
  localStorage.removeItem('user_session');
};

/**
 * Get session from localStorage
 * Returns null if no session exists or if session is invalid
 */
export const getSession = (): Session | null => {
  const stored = localStorage.getItem('user_session');
  if (!stored) return null;

  try {
    return JSON.parse(stored) as Session;
  } catch {
    return null;
  }
};

/**
 * React hook for session management
 * Provides session state, loading state, and login/logout functions
 */
import { useState, useEffect } from 'react';

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const existing = getSession();
    if (existing) {
      setSession(existing);
    }
    setLoading(false);
  }, []);

  const loginFn = async () => {
    const newSession = await login();
    setSession(newSession);
  };

  const logoutFn = () => {
    logout();
    setSession(null);
  };

  return { session, loading, login: loginFn, logout: logoutFn };
};
