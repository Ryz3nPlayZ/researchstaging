'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { AIChatbar } from '@/components/ai-chatbar';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isOnboardingRoute = pathname === '/new';

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
        <div className="h-dvh bg-background flex flex-col overflow-hidden">
            <TopBar />
            <main
                className={cn(
                    'flex-1 min-h-0 pt-20 pb-24 overflow-y-auto',
                    isOnboardingRoute && 'pb-0 overflow-hidden'
                )}
            >
                {children}
            </main>
            {!isOnboardingRoute && <AIChatbar />}
        </div>
    );
}
