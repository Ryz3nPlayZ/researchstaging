import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get Google auth URL from backend
      const response = await axios.get(`${BACKEND_URL}/api/auth/google-url`);
      const authUrl = response.data.auth_url;

      // Open popup for Google OAuth
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        setError('Please allow popups for this site');
        setLoading(false);
        return;
      }

      // Listen for message from popup
      const messageHandler = async (event) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'oauth-callback') {
          const { code } = event.data;

          if (code) {
            try {
              // Exchange code for token
              await login(code);

              // Close popup
              popup.close();

              // Remove event listener
              window.removeEventListener('message', messageHandler);

              // Redirect to home
              navigate('/');
            } catch (err) {
              console.error('Login failed:', err);
              setError('Authentication failed. Please try again.');
              popup.close();
              window.removeEventListener('message', messageHandler);
            }
          } else if (event.data.error) {
            setError(event.data.error);
            popup.close();
            window.removeEventListener('message', messageHandler);
          }
          setLoading(false);
        }
      };

      window.addEventListener('message', messageHandler);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          setLoading(false);
        }
      }, 1000);

    } catch (err) {
      console.error('Failed to initiate Google login:', err);
      setError('Failed to connect to authentication service');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Research Pilot</h1>
          <p className="text-muted-foreground">AI-Native Research Execution System</p>
        </div>

        <div className="bg-card border rounded-lg p-8 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2">Welcome</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to start your research journey
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-input rounded-md bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">Sign in with Google</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
}
