"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface User {
    id: string;
    username: string;
    businessName: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, businessName: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const username = session.user.email?.split('@')[0] || '';
                setUser({
                    id: session.user.id,
                    username: username,
                    businessName: session.user.user_metadata.business_name || 'Mi Negocio'
                });
            }
            setLoading(false);
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                const username = session.user.email?.split('@')[0] || '';
                setUser({
                    id: session.user.id,
                    username: username,
                    businessName: session.user.user_metadata.business_name || 'Mi Negocio'
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = (username: string, businessName: string) => {
        // This will be handled in the Login component
        // Context just updates automatically via onAuthStateChange
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null); // Force local state update
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
