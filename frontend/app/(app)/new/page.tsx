'use client';

import { Suspense } from 'react';
import { OnboardingChat } from '@/components/research-manager/onboarding-chat';

export default function OnboardingPage() {
    return (
        <div className="w-full h-full min-h-0 overflow-hidden px-4 pb-4">
            <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 rounded-2xl bg-muted animate-pulse border border-border" />
                </div>
            }>
                <OnboardingChat fullPage={true} />
            </Suspense>
        </div>
    );
}
