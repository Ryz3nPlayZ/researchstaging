'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate signup then login
        await new Promise(resolve => setTimeout(resolve, 800));
        await login(email, name);
        router.push('/onboarding');
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
                    <h1 className="text-2xl font-bold text-gray-900 font-ui mb-2">Create your account</h1>
                    <p className="text-sm text-gray-500">
                        Start your 14-day free trial today
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700 font-ui uppercase tracking-wide">Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
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

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700 font-ui uppercase tracking-wide">Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
                            className="bg-white/50 border-gray-200 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700 font-ui uppercase tracking-wide">Confirm Password</label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            className="bg-white/50 border-gray-200 focus:bg-white transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1C7C54] hover:bg-[#1B512D] text-white py-3 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <a href="/login" className="font-semibold text-[#1C7C54] hover:text-[#1B512D] transition-colors">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}
