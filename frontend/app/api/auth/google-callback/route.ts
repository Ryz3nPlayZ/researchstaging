/**
 * Server-side Google OAuth callback handler.
 *
 * This lives at /api/auth/google-callback which is ALWAYS skipped by the
 * Next.js edge middleware (middleware.ts bypasses all /api/* paths).
 *
 * Flow:
 *  1. Google redirects here with ?code=...
 *  2. We exchange the code with the Railway backend
 *  3. Set the httpOnly session cookie
 *  4. Redirect the browser to /onboarding (new user) or /dashboard
 */

import { type NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'research_token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Use the internal API URL (same env var Vercel has set).
// On the server side we can read NEXT_PUBLIC_ vars just fine.
function getApiUrl() {
    const raw = process.env.NEXT_PUBLIC_API_URL ?? '';
    return raw.startsWith('http://') || raw.startsWith('https://')
        ? raw
        : 'http://localhost:8000';
}

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
        const msg = encodeURIComponent(error ?? 'oauth_cancelled');
        return NextResponse.redirect(new URL(`/login?error=${msg}`, request.url));
    }

    const apiUrl = getApiUrl();

    try {
        // Exchange the Google auth code for a session via the Railway backend
        const res = await fetch(`${apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            const detail = (err as { detail?: string }).detail ?? 'Authentication failed';
            console.error('[google-callback] backend error:', detail);
            return NextResponse.redirect(
                new URL(`/login?error=${encodeURIComponent(detail)}`, request.url),
            );
        }

        const data = await res.json();
        const token = data.token as string;
        const isNewUser = (data.user as { is_new_user?: boolean })?.is_new_user;

        const redirectPath = isNewUser ? '/onboarding' : '/dashboard';
        const response = NextResponse.redirect(new URL(redirectPath, request.url));

        // Set the httpOnly cookie so middleware allows protected routes
        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: MAX_AGE,
            path: '/',
        });

        return response;
    } catch (e) {
        console.error('[google-callback] unexpected error:', e);
        return NextResponse.redirect(new URL('/login?error=server_error', request.url));
    }
}
