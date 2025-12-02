"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Login() {
    const { loading: authLoading } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
        const email = `${cleanUsername}@example.com`;

        try {
            if (isRegistering) {
                if (!cleanBusinessName) {
                    setError('El nombre del emprendimiento es obligatorio');
                    setLoading(false);
                    return;
                }

                // Register new user via API (auto-confirmed)
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email,
                        password: cleanPassword,
                        businessName: cleanBusinessName
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data.error?.includes('already registered') || data.error?.includes('already exists')) {
                        setError('El usuario ya existe. Intenta iniciar sesión.');
                    } else {
                        throw new Error(data.error || 'Error al registrar');
                    }
                } else {
                    // Now login with the created user
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email: email,
                        password: cleanPassword
                    });

                    if (signInError) throw signInError;
                }
            } else {
                // Login existing user
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: cleanPassword
                });

                if (signInError) {
                    if (signInError.message.includes('Invalid login credentials')) {
                        setError('Usuario o contraseña incorrectos.');
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
                    <h1 className="text-6xl font-bold mb-2 tracking-tight" style={{
                        fontFamily: "'Outfit', sans-serif",
                        color: '#ffffff',
                        textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
                    }}>
                        {isRegistering ? 'Crear Cuenta' : 'Bienvenido/a'}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {isRegistering ? 'Configura tu espacio en Tzinails' : 'Ingresa a tu gestor de turnos'}
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
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                                placeholder="Ej: Tzinails"
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
        </div>
    );
}
