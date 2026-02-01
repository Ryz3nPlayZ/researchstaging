import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login, mockLogin, logout, getMe } from '../lib/api';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: () => Promise.resolve(),
  mockLogin: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
          const user = await getMe(savedToken);
          setUser(user);
          setToken(savedToken);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loginAction = useCallback(async (code) => {
    try {
      const response = await login(code);
      const { user, token } = response;

      // Save token to localStorage
      localStorage.setItem('auth_token', token);

      // Update state
      setUser(user);
      setToken(token);

      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const mockLoginAction = useCallback(async (email, name) => {
    try {
      const response = await mockLogin(email, name);
      const { user, token } = response;

      // Save token to localStorage
      localStorage.setItem('auth_token', token);

      // Update state
      setUser(user);
      setToken(token);

      return user;
    } catch (error) {
      console.error('Mock login failed:', error);
      throw error;
    }
  }, []);

  const logoutAction = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token from localStorage
      localStorage.removeItem('auth_token');

      // Clear state
      setUser(null);
      setToken(null);
    }
  }, []);

  const checkAuthAction = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        const user = await getMe(savedToken);
        setUser(user);
        setToken(savedToken);
        return user;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      setToken(null);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: loginAction,
        mockLogin: mockLoginAction,
        logout: logoutAction,
        checkAuth: checkAuthAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
