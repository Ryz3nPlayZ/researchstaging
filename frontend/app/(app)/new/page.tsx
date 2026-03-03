'use client';

import { Suspense } from 'react';
import { OnboardingChat } from '@/components/research-manager/onboarding-chat';

export default function OnboardingPage() {
    return (
        <div className="w-full h-[calc(100vh-64px)]">
            <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 rounded-2xl bg-accent-500/20 animate-pulse" />
                </div>
            }>
                <OnboardingChat fullPage={true} />
            </Suspense>
        </div>
    );
}
