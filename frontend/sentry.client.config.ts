// Sentry client-side configuration (runs in browser)
// Learn more: https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV,

        // Capture 10% of traces for performance monitoring
        tracesSampleRate: 0.1,

        // Capture 5% of replays on normal sessions, 100% on sessions with errors
        replaysSessionSampleRate: 0.05,
        replaysOnErrorSampleRate: 1.0,

        integrations: [
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],

        // Don't send user PII unless explicitly opted-in
        sendDefaultPii: false,
    });
}
