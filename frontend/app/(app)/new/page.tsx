'use client';

import { Suspense } from 'react';
import { OnboardingChat } from '@/components/research-manager/onboarding-chat';

export default function OnboardingPage() {
    return (
        <div className="w-full h-[calc(100vh-80px)] p-6">
            <Suspense fallback={<div className="animate-pulse bg-white rounded-3xl h-full w-full border border-slate-200" />}>
                <OnboardingChat fullPage={true} />
            </Suspense>
        </div>
    );
}
