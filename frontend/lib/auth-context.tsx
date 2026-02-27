'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    type User,
    type Session,
    loginWithGoogle,
    loginWithMock,
    loginWithCode,
    logout as authLogout,
    fetchCurrentUser,
    getStoredToken,
    storeToken,
    clearStoredToken,
} from './auth';

interface AuthContextValue {
    user: User | null;
    session: Session | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithMock: (email: string, name: string) => Promise<void>;
    loginWithCode: (code: string) => Promise<Session>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    session: null,
    loading: true,
    loginWithGoogle: async () => { },
    loginWithMock: async () => { },
    loginWithCode: async () => ({ user: null as unknown as User, token: '' }),
    logout: async () => { },
    refreshUser: async () => { },
});

/** Normalise the raw backend /api/auth/me response to our User shape. */
function normalizeUser(raw: Record<string, unknown>): User {
    return {
        id: raw.id as string,
        email: raw.email as string,
        name: (raw.name as string | null) ?? null,
        picture_url: (raw.picture_url as string | null) ?? null,
        credits: (raw.credits_remaining as number) ?? 0,
        role: (raw.role as string | null) ?? null,
        is_admin: (raw.is_admin as boolean) ?? false,
    };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount.
    // Priority order:
    //   1. localStorage token (fast path — most common)
    //   2. httpOnly cookie (set by /api/auth/google-callback server-side redirect)
    useEffect(() => {
        async function restoreSession() {
            // ── 1. localStorage fast-path ───────────────────────────────────
            const storedToken = getStoredToken();
            if (storedToken) {
                const user = await fetchCurrentUser(storedToken);
                if (user) {
                    setSession({ user, token: storedToken });
                    setLoading(false);
                    return;
                }
                // Token in localStorage is expired/invalid — clear it and fall through
                clearStoredToken();
            }

            // ── 2. Cookie restore (server-side callback flow) ───────────────
            // GET /api/session reads the httpOnly cookie and validates with backend.
            try {
                const res = await fetch('/api/session');
                if (res.ok) {
                    const { token, user: rawUser } = await res.json() as {
                        token: string | null;
                        user: Record<string, unknown> | null;
                    };
                    if (token && rawUser) {
                        const user = normalizeUser(rawUser);
                        storeToken(token); // persist to localStorage for subsequent visits
                        setSession({ user, token });
                        setLoading(false);
                        return;
                    }
                }
            } catch {
                // Network error — proceed as unauthenticated
            }

            setLoading(false);
        }

        restoreSession();
    }, []);

    const handleLoginWithGoogle = useCallback(async () => {
        await loginWithGoogle();
        // Navigation happens inside loginWithGoogle (browser redirect)
    }, []);

    const handleLoginWithMock = useCallback(async (email: string, name: string) => {
        const newSession = await loginWithMock(email, name);
        setSession(newSession);
    }, []);

    const handleLoginWithCode = useCallback(async (code: string): Promise<Session> => {
        const newSession = await loginWithCode(code);
        setSession(newSession);
        return newSession;
    }, []);

    const handleLogout = useCallback(async () => {
        await authLogout();
        setSession(null);
    }, []);

    const refreshUser = useCallback(async () => {
        const token = session?.token ?? getStoredToken();
        if (!token) return;
        const user = await fetchCurrentUser(token);
        if (user && session) {
            setSession({ ...session, user });
        }
    }, [session]);

    return (
        <AuthContext.Provider
            value={{
                user: session?.user ?? null,
                session,
                loading,
                loginWithGoogle: handleLoginWithGoogle,
                loginWithMock: handleLoginWithMock,
                loginWithCode: handleLoginWithCode,
                logout: handleLogout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
