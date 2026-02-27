import { type NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'research_token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getApiUrl() {
    const raw = process.env.NEXT_PUBLIC_API_URL ?? '';
    return raw.startsWith('http://') || raw.startsWith('https://')
        ? raw
        : 'http://localhost:8000';
}

/**
 * GET /api/session
 * Reads the httpOnly cookie and validates the token with the backend.
 * Used by AuthContext to restore a session when localStorage is empty
 * (e.g. after the server-side OAuth callback sets the cookie).
 */
export async function GET(request: NextRequest) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
        return NextResponse.json({ token: null, user: null });
    }

    const apiUrl = getApiUrl();
    try {
        const res = await fetch(`${apiUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            return NextResponse.json({ token: null, user: null });
        }
        const user = await res.json();
        return NextResponse.json({ token, user });
    } catch {
        return NextResponse.json({ token: null, user: null });
    }
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const token = body?.token as string | undefined;

    if (!token) {
        return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: MAX_AGE,
        path: '/',
    });
    return response;
}

export async function DELETE() {
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(COOKIE_NAME);
    return response;
}
