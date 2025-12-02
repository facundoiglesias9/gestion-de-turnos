"use client";

import React, { useEffect } from 'react';
import Login from '@/components/Login';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    if (user) {
        return null; // Or a loading spinner while redirecting
    }

    return <Login />;
}
