'use client';

import { Suspense } from 'react';
import { OnboardingChat } from '@/components/research-manager/onboarding-chat';

export default function OnboardingPage() {
    return (
        <div className="w-full h-[calc(100vh-80px)] flex items-start justify-center p-6">
            <Suspense fallback={<div className="animate-pulse bg-card rounded-xl h-full w-full max-w-2xl border border-border" />}>
                <OnboardingChat fullPage={true} />
            </Suspense>
        </div>
    );
}
