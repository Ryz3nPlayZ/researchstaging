// Required by @sentry/nextjs for the App Router.
// This file is automatically loaded by Next.js when the app starts.

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config');
    }
    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.server.config');
    }
}
