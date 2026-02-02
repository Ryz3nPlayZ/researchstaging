import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const isMounted = useRef(true);
  const loadingTimeoutRef = useRef(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('[AuthContext] Starting auth check...');
      try {
        const savedToken = localStorage.getItem('auth_token');
        console.log('[AuthContext] Saved token found:', !!savedToken);

        if (savedToken) {
          try {
            console.log('[AuthContext] Calling getMe...');
            const user = await getMe(savedToken);
            console.log('[AuthContext] getMe success:', user);
            // Don't check isMounted here - just set state
            setUser(user);
            setToken(savedToken);
          } catch (apiError) {
            // Token is invalid or API error
            console.error('[AuthContext] Token invalid or API error:', apiError);
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('[AuthContext] Auth check failed:', error);
        localStorage.removeItem('auth_token');
      } finally {
        // Always set loading to false, no matter what
        console.log('[AuthContext] Setting loading to false');
        setLoading(false);
        // Clear timeout since auth check completed
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      }
    };

    console.log('[AuthContext] Auth check useEffect running');

    // Set up emergency timeout to force loading state to false
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('[AuthContext] Auth check timeout - forcing loading to false');
      setLoading(false);
    }, 8000); // 8 second emergency timeout

    checkAuth();

    return () => {
      console.log('[AuthContext] Cleanup');
      isMounted.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
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
