import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/common';
import { authApi } from '@/api/client';
import { useAuthStore } from '@/store';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError('');

    const result = await authApi.login(email.trim(), name.trim() || undefined);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      login(result.data.user, result.data.token);
      navigate('/');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-kimidark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-kimipurple-500 to-kimiblue-500 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Kimi UI</h1>
          <p className="text-gray-400">Alternative interface for Research Pilot</p>
        </div>

        {/* Login Form */}
        <div className="bg-kimidark-800 border border-kimidark-600 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-kimidark-700 border border-kimidark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-kimipurple-500/50 focus:ring-1 focus:ring-kimipurple-500/30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-kimidark-700 border border-kimidark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-kimipurple-500/50 focus:ring-1 focus:ring-kimipurple-500/30"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Uses mock authentication for local development.
              <br />
              Any email will work.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
