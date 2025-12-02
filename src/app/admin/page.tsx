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

interface Log {
    id: string;
    created_at: string;
    business_name: string;
    error_message: string;
    context: string;
}

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [userTurns, setUserTurns] = useState<Turn[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
    const [logs, setLogs] = useState<Log[]>([]);

    useEffect(() => {
        if (!loading) {
            if (!user || user.username !== 'facundo') { // Simple check, RLS enforces security anyway
                router.push('/');
                return;
            }

            loadProfiles();
            loadLogs();
        }
    }, [user, loading, router]);

    const loadProfiles = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*');

        if (data) setProfiles(data);
        if (error) console.error('Error loading profiles:', error);
    };

    const loadLogs = async () => {
        const { data, error } = await supabase
            .from('app_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) setLogs(data);
        if (error) console.error('Error loading logs:', error);
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

    const handleDeleteUser = async (userId: string, businessName: string) => {
        if (!confirm(`¿Estás seguro de que quieres ELIMINAR DEFINITIVAMENTE a "${businessName}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const response = await fetch('/api/admin/delete-user', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    adminEmail: 'facundo@example.com' // Send admin email for verification
                })
            });

            if (response.ok) {
                // Remove from local state
                setProfiles(profiles.filter(p => p.id !== userId));
                if (selectedUser === userId) {
                    setSelectedUser(null);
                    setUserTurns([]);
                }
                alert('Usuario eliminado correctamente.');
            } else {
                const data = await response.json();
                alert('Error al eliminar: ' + (data.error || 'Desconocido'));
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error al procesar la solicitud.');
        }
    };

    if (loading) return <div className="text-white p-10">Cargando...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-purple-400">Panel de Administración</h1>
                    <div className="flex gap-4">
                        <div className="flex bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Usuarios
                            </button>
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'logs' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Logs de Errores
                            </button>
                        </div>
                        <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white px-4 py-2">
                            Volver al Inicio
                        </button>
                    </div>
                </div>

                {activeTab === 'users' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Sidebar: List of Businesses */}
                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 h-fit">
                            <h2 className="text-xl font-bold mb-4 text-white">Emprendimientos</h2>
                            <div className="space-y-2">
                                {profiles.map(profile => (
                                    <div key={profile.id} className="flex gap-2 group">
                                        <button
                                            onClick={() => loadUserTurns(profile.id)}
                                            className={`flex-1 text-left p-3 rounded-lg transition-colors ${selectedUser === profile.id
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                                }`}
                                        >
                                            <div className="font-bold">{profile.business_name}</div>
                                            <div className="text-xs opacity-70">{profile.email}</div>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(profile.id, profile.business_name)}
                                            className="p-3 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar usuario"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
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
                ) : (
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Registro de Errores (Logs)</h2>
                            <button onClick={loadLogs} className="text-sm text-purple-400 hover:text-purple-300">
                                Actualizar
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                        <th className="p-3">Fecha</th>
                                        <th className="p-3">Usuario/Negocio</th>
                                        <th className="p-3">Contexto</th>
                                        <th className="p-3">Error</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-700/30 text-sm">
                                            <td className="p-3 text-slate-400 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-white font-medium">
                                                {log.business_name}
                                            </td>
                                            <td className="p-3 text-purple-400">
                                                {log.context}
                                            </td>
                                            <td className="p-3 text-red-300 font-mono text-xs">
                                                {log.error_message}
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-500">
                                                No hay errores registrados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
