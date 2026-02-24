'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useAuth } from '@/lib/auth-context';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
// Only init if the key looks like a real PostHog key (starts with 'phc_')
const POSTHOG_ENABLED = POSTHOG_KEY.startsWith('phc_');

function PostHogIdentify() {
    const { user } = useAuth();

    useEffect(() => {
        if (!POSTHOG_ENABLED) return;
        if (user) {
            posthog.identify(user.id, {
                email: user.email,
                name: user.name ?? undefined,
                role: user.role ?? undefined,
                is_admin: user.is_admin ?? false,
            });
        } else {
            posthog.reset();
        }
    }, [user]);

    return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (!POSTHOG_ENABLED) return;
        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            person_profiles: 'identified_only',
            capture_pageview: false, // Handled manually for SPA
            capture_pageleave: true,
        });
    }, []);

    if (!POSTHOG_ENABLED) return <>{children}</>;

    return (
        <PHProvider client={posthog}>
            <PostHogIdentify />
            {children}
        </PHProvider>
    );
}

/**
 * Track a custom event.
 * Safe to call even when PostHog is not configured (no-ops).
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
    if (!POSTHOG_ENABLED) return;
    posthog.capture(event, properties);
}
