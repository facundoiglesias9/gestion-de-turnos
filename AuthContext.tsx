"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

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
        // Check active session
        const checkSession = async () => {
            try {
                const { data } = await supabase.auth.getSession();
                if (data?.session?.user) {
                    const username = data.session.user.email?.split('@')[0] || '';
                    setUser({
                        id: data.session.user.id,
                        username: username,
                        businessName: data.session.user.user_metadata.business_name || 'Mi Negocio'
                    });
                }
            } catch (error) {
                console.error("Error checking session:", error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                const username = session.user.email?.split('@')[0] || '';
                const businessName = session.user.user_metadata.business_name || 'Mi Negocio';

                setUser({
                    id: session.user.id,
                    username: username,
                    businessName: businessName
                });

                // Sync profile for admin visibility
                supabase.from('profiles').upsert({
                    id: session.user.id,
                    email: session.user.email,
                    business_name: businessName
                }).then(({ error }) => {
                    if (error) console.error('Error syncing profile:', error);
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        // Safety timeout in case Supabase hangs
        const timeout = setTimeout(() => {
            setLoading(prev => {
                if (prev) {
                    console.warn("Auth check timed out, forcing app load.");
                    return false;
                }
                return prev;
            });
        }, 3000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
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
