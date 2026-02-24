import { type NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'research_token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

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
