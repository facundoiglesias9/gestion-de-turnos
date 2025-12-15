"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';

export default function Login() {
    const { loading: authLoading } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showBusinessNameModal, setShowBusinessNameModal] = useState(false);
    const [newBusinessName, setNewBusinessName] = useState('');


    useEffect(() => {
        // Check if user is logged in but has no business name (e.g. after Google Login)
        const checkBusinessName = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && !user.user_metadata?.business_name) {
                setShowBusinessNameModal(true);
            }
        };
        checkBusinessName();
    }, []);

    const handleGoogleLogin = async () => {
        try {
            const isAndroid = Capacitor.getPlatform() === 'android';
            const redirectTo = isAndroid
                ? 'com.facundo.turnos://login-callback'
                : window.location.origin + '/auth/callback';

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectTo,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (error: any) {
            setError(error.message);
        }
    };

    const handleSaveBusinessName = async () => {
        if (!newBusinessName.trim()) return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { business_name: newBusinessName.trim() }
            });
            if (error) throw error;
            setShowBusinessNameModal(false);
            window.location.reload(); // Reload to update context
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const cleanUsername = username.trim().toLowerCase();
        const cleanPassword = password.trim();
        const cleanBusinessName = businessName.trim();

        if (!cleanUsername || !cleanPassword) {
            setError('Por favor completa todos los campos');
            setLoading(false);
            return;
        }

        // Convert username to email format for Supabase
        const email = `${cleanUsername}@gestionturnos.com`;

        try {
            if (isRegistering) {
                if (!cleanBusinessName) {
                    setError('El nombre del emprendimiento es obligatorio');
                    setLoading(false);
                    return;
                }

                // Register directly with Supabase
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: email,
                    password: cleanPassword,
                    options: {
                        data: {
                            business_name: cleanBusinessName
                        }
                    }
                });

                if (signUpError) {
                    if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
                        setError('El usuario ya existe. Intenta iniciar sesión.');
                        setLoading(false);
                        return;
                    }
                    throw signUpError;
                }

                // If email confirmation is enabled, session will be null
                if (signUpData.user && !signUpData.session) {
                    setError('Registro exitoso. Por favor revisa tu email para confirmar la cuenta.');
                    setLoading(false);
                    return;
                }
            } else {
                // Login existing user
                // First try with new domain
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: cleanPassword
                });

                if (signInError) {
                    // If failed, try with old domain (backward compatibility for v1.2/1.3 users)
                    if (signInError.message.includes('Invalid login credentials')) {
                        const oldEmail = `${cleanUsername}@example.com`;
                        const { error: oldSignInError } = await supabase.auth.signInWithPassword({
                            email: oldEmail,
                            password: cleanPassword
                        });

                        if (oldSignInError) {
                            if (oldSignInError.message.includes('Invalid login credentials')) {
                                setError('Usuario o contraseña incorrectos.');
                            } else {
                                throw oldSignInError;
                            }
                        }
                    } else {
                        throw signInError;
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 font-sans">
            <div className="w-full max-w-sm p-6">


                <div className="text-center mb-8 relative z-10">
                    <h1 className="text-4xl font-bold mb-2 tracking-tight" style={{
                        fontFamily: "'Outfit', sans-serif",
                        color: '#ffffff',
                        textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
                    }}>
                        {isRegistering ? 'Crear Cuenta' : 'Bienvenido/a'}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {isRegistering ? 'Configura tu espacio' : 'Ingresa a tu gestor de turnos'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                            Usuario
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                            placeholder="usuario"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {isRegistering && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                                Nombre del emprendimiento
                            </label>
                            <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                                placeholder="Ej: Test"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="text-red-300 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20 backdrop-blur-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Cargando...' : (isRegistering ? 'Registrarse' : 'Ingresar')}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-800"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-zinc-950 text-gray-400">O continuar con</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Google
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-white/5 pt-6 relative z-10">
                    <button
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                        }}
                        className="text-sm text-gray-400 hover:text-white transition-colors font-medium"
                    >
                        {isRegistering
                            ? '¿Ya tienes cuenta? Inicia sesión'
                            : '¿No tienes cuenta? Regístrate aquí'}
                    </button>
                </div>
            </div>

            {showBusinessNameModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-2">Casi listo</h2>
                        <p className="text-gray-400 mb-6">Para terminar, necesitamos el nombre de tu emprendimiento.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nombre del emprendimiento
                                </label>
                                <input
                                    type="text"
                                    value={newBusinessName}
                                    onChange={(e) => setNewBusinessName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                                    placeholder="Ej: Mi Estética"
                                />
                            </div>
                            <button
                                onClick={handleSaveBusinessName}
                                disabled={!newBusinessName.trim() || loading}
                                className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : 'Comenzar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
