"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';
import TurnList, { Turn } from '../../TurnList';
import TurnForm from '../../TurnForm';
import Link from 'next/link';

export default function TurnosPage() {
    const { user, loading: authLoading } = useAuth();
    const [turns, setTurns] = useState<Turn[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editingTurn, setEditingTurn] = useState<any>(null); // TurnData shape
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadTurns();
        }
    }, [user]);

    const loadTurns = async () => {
        const { data, error } = await supabase
            .from('turns')
            .select('*')
            .eq('user_id', user?.id) // snake_case: user_id
            .order('date_time', { ascending: true }); // snake_case: date_time

        if (error) {
            console.error('Error loading turns:', error);
        } else {
            // Map snake_case -> camelCase
            const mappedTurns: Turn[] = (data || []).map((t: any) => ({
                id: t.id,
                userId: t.user_id,
                clientName: t.client_name,
                dateTime: t.date_time,
                task: t.task,
                completed: t.completed,
                estimatedPrice: t.estimated_price,
                deposit: t.deposit,
                paid: t.paid,
                reminderTime: t.reminder_time,
                reminderSent: t.reminder_sent
            }));
            setTurns(mappedTurns);
        }
        setLoading(false);
    };

    const handleAddTurn = async (turnData: any) => {
        if (!user) return;

        // Map camelCase -> snake_case
        const newTurn = {
            user_id: user.id,
            client_name: turnData.clientName,
            date_time: turnData.dateTime,
            task: turnData.task,
            estimated_price: turnData.estimatedPrice,
            completed: false,
            paid: false
        };

        const { error } = await supabase
            .from('turns')
            .insert(newTurn);

        if (error) {
            alert('Error al crear turno');
            console.error(error);
        } else {
            loadTurns();
        }
    };

    const handleDeleteTurn = async (id: string) => {
        if (!confirm('¿Eliminar turno?')) return;
        const { error } = await supabase.from('turns').delete().eq('id', id);
        if (!error) loadTurns();
    };

    const handleStatusChange = async (id: string, status: boolean) => {
        const { error } = await supabase.from('turns').update({ completed: status }).eq('id', id);
        if (!error) loadTurns();
    };

    // New Edit Logic
    const handleEditTurn = (turn: Turn) => {
        setIsEditing(true);
        setEditingId(turn.id);
        setEditingTurn({
            clientName: turn.clientName,
            dateTime: turn.dateTime,
            task: turn.task || '',
            estimatedPrice: turn.estimatedPrice || 0
        });
        // Scroll to top or form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdateTurn = async (turnData: any) => {
        if (!editingId) return;

        // Map camelCase -> snake_case
        const updates = {
            client_name: turnData.clientName,
            date_time: turnData.dateTime,
            task: turnData.task,
            estimated_price: turnData.estimatedPrice
        };

        const { error } = await supabase
            .from('turns')
            .update(updates)
            .eq('id', editingId);

        if (error) {
            alert('Error al actualizar');
            console.error(error);
        } else {
            setIsEditing(false);
            setEditingId(null);
            setEditingTurn(null);
            loadTurns();
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingId(null);
        setEditingTurn(null);
    };

    if (authLoading) return <div className="p-4 text-white">Cargando...</div>;
    if (!user) return (
        <div className="p-4 text-white flex flex-col items-center justify-center h-screen space-y-4">
            <p className="text-xl">Debes iniciar sesión para ver los turnos</p>
            <Link href="/" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors">
                Ir al Inicio para Loguearse
            </Link>
        </div>
    );

    return (
        <div className="p-4 container mx-auto max-w-7xl space-y-6 pb-24">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">Gestión de Turnos</h1>
                <Link href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-400 font-bold rounded-lg transition-colors border border-purple-500/30">
                    ← Volver a Precios
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 lg:sticky lg:top-4">
                    <div className="glass-card p-1">
                        <TurnForm
                            onAddTurn={handleAddTurn}
                            onUpdateTurn={handleUpdateTurn}
                            initialData={editingTurn}
                            isEditing={isEditing}
                            onCancel={handleCancelEdit}
                        />
                    </div>
                </div>

                <div className="lg:col-span-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 glass-card">
                            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-400 text-lg">Cargando turnos...</p>
                        </div>
                    ) : (
                        <TurnList
                            turns={turns}
                            onDelete={handleDeleteTurn}
                            onStatusChange={handleStatusChange}
                            onEditTurn={handleEditTurn}
                            onPaidChange={async (id, paid) => {
                                await supabase.from('turns').update({ paid }).eq('id', id);
                                loadTurns();
                            }}
                            onUpdatePrice={async (id, price) => {
                                await supabase.from('turns').update({ estimated_price: price }).eq('id', id);
                                loadTurns();
                            }}
                            onUpdateDeposit={async (id, deposit) => {
                                await supabase.from('turns').update({ deposit }).eq('id', id);
                                loadTurns();
                            }}
                            onSetReminder={async (id, date) => {
                                await supabase.from('turns').update({ reminder_time: date }).eq('id', id);
                                loadTurns();
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
