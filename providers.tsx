"use client";

import { AuthProvider } from "./AuthContext";
import { useEffect } from "react";
import { App } from '@capacitor/app';

import { supabase } from "./supabase";
import { useRouter } from "next/navigation";
import { Capacitor } from '@capacitor/core';

export function Providers({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        // Deep link listener
        App.addListener('appUrlOpen', (event) => {
            try {
                const url = new URL(event.url);
                // Check if it's our callback scheme
                if (url.host === 'login-callback') {
                    // Parse hash for access_token
                    // URL fragment: #access_token=...&refresh_token=...
                    const hash = url.hash.substring(1);
                    const params = new URLSearchParams(hash);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken && refreshToken) {
                        supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        }).then(({ error }) => {
                            if (!error) {
                                router.push('/');
                            }
                        });
                    }
                }
            } catch (e) {
                console.error('Error parsing deep link:', e);
            }
        });

    }, [router]);

    return <AuthProvider>{children}</AuthProvider>;
}
