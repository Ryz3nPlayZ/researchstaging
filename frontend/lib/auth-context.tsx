'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Session, type User, getSession, login as authLogin, logout as authLogout } from './auth';

interface AuthContextValue {
    user: User | null;
    session: Session | null;
    loading: boolean;
    login: (email?: string, name?: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    session: null,
    loading: true,
    login: async () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const existing = getSession();
        if (existing) {
            setSession(existing);
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email?: string, name?: string) => {
        const newSession = await authLogin(email, name);
        setSession(newSession);
    }, []);

    const logout = useCallback(() => {
        authLogout();
        setSession(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user: session?.user ?? null,
                session,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
