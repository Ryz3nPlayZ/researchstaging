import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * OAuth Callback Handler
 *
 * This component handles the OAuth callback from Google.
 * It's used as an intermediate page that:
 * 1. Receives the auth code from the URL
 * 2. Sends it to the opener (main window) via postMessage
 * 3. Closes itself
 *
 * The main window receives the code and completes the login flow.
 */
export function OAuthCallback() {
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Get code from URL query params
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        // Send error to opener
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth-callback',
            error: error || 'Authentication failed'
          }, window.location.origin);
        }
        window.close();
        return;
      }

      if (code) {
        // Send code to opener (main window)
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth-callback',
            code: code
          }, window.location.origin);

          // Close popup after a short delay to ensure message is received
          setTimeout(() => {
            window.close();
          }, 100);
        } else {
          // Fallback: if no opener (opened in same tab), complete login here
          try {
            await login(code);
            window.location.href = '/';
          } catch (err) {
            console.error('Login failed:', err);
            window.location.href = '/login';
          }
        }
      }
    };

    handleCallback();
  }, [login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
