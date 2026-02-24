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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount — validate token with backend
    useEffect(() => {
        const token = getStoredToken();
        if (!token) {
            setLoading(false);
            return;
        }
        fetchCurrentUser(token).then((user) => {
            if (user) {
                setSession({ user, token });
            }
            setLoading(false);
        });
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
