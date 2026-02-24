'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { AIChatbar } from '@/components/ai-chatbar';
import { useAuth } from '@/lib/auth-context';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [loading, user, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
                        <span className="text-primary-foreground font-bold text-xs">R</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <TopBar />
            <main className="pt-20 pb-24">
                {children}
            </main>
            <AIChatbar />
        </div>
    );
}
