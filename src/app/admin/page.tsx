"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Profile {
    id: string;
    business_name: string;
    email: string;
}

interface Turn {
    id: string;
    client_name: string;
    date_time: string;
    task: string;
    estimated_price: number;
    completed: boolean;
    paid: boolean;
}

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [userTurns, setUserTurns] = useState<Turn[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user || user.username !== 'facundoiglesias9') { // Simple check, RLS enforces security anyway
                router.push('/');
                return;
            }

            loadProfiles();
        }
    }, [user, loading, router]);

    const loadProfiles = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*');

        if (data) setProfiles(data);
        if (error) console.error('Error loading profiles:', error);
    };

    const loadUserTurns = async (userId: string) => {
        setIsLoadingData(true);
        setSelectedUser(userId);
        const { data, error } = await supabase
            .from('turns')
            .select('*')
            .eq('user_id', userId)
            .order('date_time', { ascending: false });

        if (data) setUserTurns(data);
        if (error) console.error('Error loading turns:', error);
        setIsLoadingData(false);
    };

    if (loading) return <div className="text-white p-10">Cargando...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-purple-400">Panel de Administración</h1>
                    <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white">
                        Volver al Inicio
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar: List of Businesses */}
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 h-fit">
                        <h2 className="text-xl font-bold mb-4 text-white">Emprendimientos</h2>
                        <div className="space-y-2">
                            {profiles.map(profile => (
                                <button
                                    key={profile.id}
                                    onClick={() => loadUserTurns(profile.id)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedUser === profile.id
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                        }`}
                                >
                                    <div className="font-bold">{profile.business_name}</div>
                                    <div className="text-xs opacity-70">{profile.email}</div>
                                </button>
                            ))}
                            {profiles.length === 0 && (
                                <p className="text-slate-500 text-sm">No hay perfiles visibles aún.</p>
                            )}
                        </div>
                    </div>

                    {/* Main Content: User Details */}
                    <div className="md:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700 min-h-[500px]">
                        {selectedUser ? (
                            <>
                                <h2 className="text-2xl font-bold mb-6 text-white">
                                    Turnos de {profiles.find(p => p.id === selectedUser)?.business_name}
                                </h2>

                                {isLoadingData ? (
                                    <p>Cargando datos...</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                                    <th className="p-3">Fecha</th>
                                                    <th className="p-3">Cliente</th>
                                                    <th className="p-3">Tarea</th>
                                                    <th className="p-3 text-right">Precio</th>
                                                    <th className="p-3 text-center">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700/50">
                                                {userTurns.map(turn => (
                                                    <tr key={turn.id} className="hover:bg-slate-700/30">
                                                        <td className="p-3 text-slate-300">
                                                            {new Date(turn.date_time).toLocaleDateString()} <br />
                                                            <span className="text-xs text-slate-500">
                                                                {new Date(turn.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 font-medium text-white">{turn.client_name}</td>
                                                        <td className="p-3 text-slate-300">{turn.task}</td>
                                                        <td className="p-3 text-right font-mono text-green-400">
                                                            ${turn.estimated_price}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {turn.completed ? (
                                                                <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs">Completado</span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded text-xs">Pendiente</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {userTurns.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="p-8 text-center text-slate-500">
                                                            Este usuario no tiene turnos registrados.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                                <p>Selecciona un emprendimiento para ver sus detalles</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
