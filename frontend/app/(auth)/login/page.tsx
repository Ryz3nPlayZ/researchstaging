'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('test@example.com');
    const [name, setName] = useState('Test User');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await login(email, name);
        router.push('/dashboard');
    };

    return (
        <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8 justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-900">
                    <span className="text-base-0 font-ui text-sm font-bold leading-none">R</span>
                </div>
                <span className="font-ui text-lg font-bold text-base-900 tracking-tight">Research</span>
            </div>

            {/* Card */}
            <div className="glass rounded-2xl p-8 backdrop-blur-md bg-white/70 border border-white/20 shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 font-ui mb-2">Welcome back</h1>
                    <p className="text-sm text-gray-500">
                        Sign in to your research workspace
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700 font-ui uppercase tracking-wide">Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="bg-white/50 border-gray-200 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700 font-ui uppercase tracking-wide">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="bg-white/50 border-gray-200 focus:bg-white transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1C7C54] hover:bg-[#1B512D] text-white py-3 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-transparent px-2 text-gray-500 bg-white/50 backdrop-blur-sm rounded">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                            Google
                        </button>
                        <button className="flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                            GitHub
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <a href="/signup" className="font-semibold text-[#1C7C54] hover:text-[#1B512D] transition-colors">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}
