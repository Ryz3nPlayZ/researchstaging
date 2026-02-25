/**
 * Authentication utilities.
 *
 * Auth flow:
 * 1. User clicks "Continue with Google" → browser redirects to Google OAuth
 * 2. Google redirects back to /auth/callback?code=...
 * 3. Callback page exchanges code via POST /api/auth/login { code }
 * 4. Backend validates, returns { user, token }
 * 5. Token is stored in an httpOnly cookie via POST /api/session
 * 6. AuthContext reads /api/auth/me on mount to restore server-validated session
 *
 * Dev fallback:
 * If NEXT_PUBLIC_DEV_AUTH=true, the login page shows an email/name form
 * that POSTs to /api/auth/login { email, name } for mock auth.
 */

export interface User {
    id: string;
    email: string;
    name: string | null;
    picture_url: string | null;
    credits: number;
    role?: string | null;
    is_admin?: boolean;
}

export interface Session {
    user: User;
    token: string;
}

// ─── Cookie helpers (middleware reads this) ───────────────────────────────────

export async function setSessionCookie(token: string): Promise<void> {
    await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
}

export async function clearSessionCookie(): Promise<void> {
    await fetch('/api/session', { method: 'DELETE' });
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/** Get the Google OAuth redirect URL from the backend, then navigate to it. */
export async function loginWithGoogle(): Promise<void> {
    const res = await fetch('/api/auth/google-url');
    const data = await res.json();
    if (data.auth_url) {
        window.location.href = data.auth_url;
    } else {
        throw new Error(data.message || 'Google OAuth is not configured');
    }
}

/** Exchange a Google OAuth code for a session. Called from the /auth/callback page. */
export async function loginWithCode(code: string): Promise<Session> {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || 'Authentication failed');
    }
    const data = await res.json();
    const session = buildSession(data);
    await setSessionCookie(session.token);
    storeToken(session.token);   // also persist to localStorage so AuthContext can restore session
    return session;
}

// ─── Dev mock auth (development only, gated by env var) ──────────────────────

export const isDev = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';

export async function loginWithMock(email: string, name: string): Promise<Session> {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || 'Mock authentication failed');
    }
    const data = await res.json();
    const session = buildSession(data);
    await setSessionCookie(session.token);
    storeToken(session.token);
    return session;
}

// ─── Session restoration ──────────────────────────────────────────────────────

/**
 * Fetch the current user from the backend using the token.
 * Called by AuthContext on mount to validate the session server-side.
 */
export async function fetchCurrentUser(token: string): Promise<User | null> {
    try {
        const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return {
            id: data.id,
            email: data.email,
            name: data.name,
            picture_url: data.picture_url,
            credits: data.credits_remaining ?? 0,
            role: data.role,
            is_admin: data.is_admin ?? false,
        };
    } catch {
        return null;
    }
}

/** Get token stored in localStorage */
const SESSION_KEY = 'research_session';

export function getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.token ?? null;
    } catch {
        return null;
    }
}

export function storeToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token }));
}

export function clearStoredToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
        // Ignore if backend is down
    }
    clearStoredToken();
    await clearSessionCookie();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSession(data: Record<string, unknown>): Session {
    const u = data.user as Record<string, unknown>;
    const token = data.token as string;
    const user: User = {
        id: u.id as string,
        email: u.email as string,
        name: (u.name as string | null) ?? null,
        picture_url: (u.picture_url as string | null) ?? null,
        credits: (u.credits_remaining as number) ?? 0,
        role: (u.role as string | null) ?? null,
        is_admin: (u.is_admin as boolean) ?? false,
    };
    storeToken(token);
    return { user, token };
}

/** Get token for API requests */
export function getToken(): string | null {
    return getStoredToken();
}

/** Get user initials from name */
export function getUserInitials(name?: string | null): string {
    const n = name || '';
    return (
        n
            .split(' ')
            .filter(Boolean)
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?'
    );
}
