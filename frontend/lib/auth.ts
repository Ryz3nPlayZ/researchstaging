// Authentication utilities — mock auth for local development
// Adapted from frontend3/lib/auth.ts

export interface User {
    id: string;
    email: string;
    name: string;
    credits: number;
}

export interface Session {
    user: User;
    token: string;
}

const SESSION_KEY = 'research_session';

/** Mock login — creates test user for development + registers with backend */
export const login = async (email?: string, name?: string): Promise<Session> => {
    const userEmail = email || 'test@example.com';
    const userName = name || 'Test User';

    // Call backend to create/retrieve user record
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, name: userName }),
        });
        if (res.ok) {
            const data = await res.json();
            const session: Session = {
                user: {
                    id: data.user?.id || 'test-user-1',
                    email: data.user?.email || userEmail,
                    name: data.user?.name || userName,
                    credits: data.user?.credits_remaining ?? 1000,
                },
                token: data.token || `mock-jwt-${Date.now()}`,
            };
            if (typeof window !== 'undefined') {
                localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            }
            return session;
        }
    } catch {
        // Backend unavailable — fall back to local-only mock
    }

    // Fallback: local-only session (no backend)
    const testUser: User = {
        id: 'test-user-1',
        email: userEmail,
        name: userName,
        credits: 1000,
    };
    const token = `mock-jwt-${Date.now()}`;
    const session: Session = { user: testUser, token };
    if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return session;
};

/** Logout — clears session */
export const logout = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
    }
};

/** Get session from localStorage */
export const getSession = (): Session | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored) as Session;
    } catch {
        return null;
    }
};

/** Get token for API requests */
export const getToken = (): string | null => {
    const session = getSession();
    return session?.token ?? null;
};

/** Get user from session */
export const getUser = (): User | null => {
    const session = getSession();
    return session?.user ?? null;
};

/** Get user initials (e.g. "TU" from "Test User") */
export const getUserInitials = (name?: string): string => {
    const n = name || getUser()?.name || '';
    return n
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};
