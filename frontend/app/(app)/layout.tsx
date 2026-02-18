'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { useAuth } from '@/lib/auth-context';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, login } = useAuth();
    const [autoLoginDone, setAutoLoginDone] = useState(false);

    useEffect(() => {
        // Auto-login with mock credentials if no session
        if (!loading && !user && !autoLoginDone) {
            setAutoLoginDone(true);
            login().catch(console.error);
        }
    }, [loading, user, autoLoginDone, login]);

    // Show loading skeleton while auth resolves
    if (loading || (!user && !autoLoginDone)) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#1C7C54] flex items-center justify-center animate-pulse">
                        <span className="text-white font-bold text-xs">R</span>
                    </div>
                    <p className="text-sm text-[#8A9A8A]">Loading workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
            <TopBar />
            <main className="max-w-[1200px] mx-auto px-6 py-6">
                {children}
            </main>
        </div>
    );
}
