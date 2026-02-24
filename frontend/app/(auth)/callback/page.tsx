'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/components/posthog-provider';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginWithCode } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setError('Google login was cancelled or denied.');
            return;
        }

        if (!code) {
            setError('No authentication code received.');
            return;
        }

        loginWithCode(code)
            .then((session) => {
                // New users → onboarding; returning users → dashboard
                const isNew = (session as { user: { is_new_user?: boolean } })?.user?.is_new_user;
                if (isNew) {
                    trackEvent('user_signed_up', { email: session.user.email });
                    router.replace('/onboarding');
                } else {
                    trackEvent('user_signed_in');
                    router.replace('/dashboard');
                }
            })
            .catch((e: Error) => {
                setError(e.message || 'Authentication failed. Please try again.');
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-full max-w-sm rounded-2xl bg-white border border-gray-200 shadow-xl p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Sign in failed</h2>
                    <p className="text-sm text-gray-500 mb-6">{error}</p>
                    <a
                        href="/login"
                        className="inline-block px-6 py-2.5 rounded-lg bg-[#1C7C54] text-white text-sm font-medium hover:bg-[#1B512D] transition-colors"
                    >
                        Back to login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-[#1C7C54] flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="text-white font-bold">R</span>
                </div>
                <p className="text-sm text-gray-500">Signing you in…</p>
            </div>
        </div>
    );
}
