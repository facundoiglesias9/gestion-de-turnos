"use client";

import React, { useState, useEffect } from 'react';

export interface Turn {
    id: string;
    userId: string;
    clientName: string;
    dateTime: string;
    task?: string;
    completed?: boolean | null;
    estimatedPrice?: number;
    paid?: boolean;
    reminderTime?: string | null;
    reminderSent?: boolean;
}

interface TurnListProps {
    turns: Turn[];
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: boolean) => void;
    onPaidChange?: (id: string, paid: boolean) => void;
    onUpdatePrice?: (id: string, newPrice: number) => void;
    onSetReminder?: (id: string, date: string | null) => void;
}

export default function TurnList({ turns, onDelete, onStatusChange, onPaidChange, onUpdatePrice, onSetReminder }: TurnListProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState<string>('');

    // Reminder Modal State
    const [reminderModalOpen, setReminderModalOpen] = useState<string | null>(null);
    const [reminderDate, setReminderDate] = useState('');
    const [reminderTime, setReminderTime] = useState('');

    // Check for reminders every minute
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            turns.forEach(turn => {
                if (turn.reminderTime && !turn.reminderSent) {
                    const reminderTime = new Date(turn.reminderTime);
                    // Check if it's time (within the last minute)
                    if (now >= reminderTime && now.getTime() - reminderTime.getTime() < 60000 * 5) {
                        // Trigger notification
                        showNotification(turn);
                    }
                }
            });
        };

        const interval = setInterval(checkReminders, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [turns]);

    const showNotification = (turn: Turn) => {
        // Browser Notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const notif = new Notification(`Recordatorio: Turno de ${turn.clientName}`, {
                body: `Es hora de avisarle a ${turn.clientName} sobre su turno.`,
                icon: '/icon.png'
            });

            notif.onclick = () => {
                window.focus();
                openWhatsApp(turn);
            };
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }

        // In-App Alert (Audio + Visual)
        const audio = new Audio('/notification.mp3'); // We'll need to add this sound later or use a default beep logic if possible, or just alert
        audio.play().catch(e => console.log('Audio play failed', e));

        if (confirm(`🔔 RECORDATORIO\n\nEs hora de avisarle a ${turn.clientName} sobre su turno.\n\n¿Quieres abrir WhatsApp ahora?`)) {
            openWhatsApp(turn);
        }
    };

    const openWhatsApp = (turn: Turn) => {
        const date = new Date(turn.dateTime).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
        const time = new Date(turn.dateTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const message = `Hola ${turn.clientName}! Te recuerdo que tienes un turno agendado para el ${date} a las ${time} hs. Por favor confirma asistencia. Gracias!`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const formatPrice = (price: number) => {
        return `$${price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const startEditing = (turn: Turn) => {
        setEditingId(turn.id);
        setEditPrice(turn.estimatedPrice?.toString() || '');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditPrice('');
    };

    const savePrice = (id: string) => {
        if (onUpdatePrice && editPrice) {
            onUpdatePrice(id, parseFloat(editPrice));
            setEditingId(null);
        }
    };

    const openReminderModal = (turn: Turn) => {
        setReminderModalOpen(turn.id);
        // Default to 1 hour before turn
        const turnDate = new Date(turn.dateTime);
        turnDate.setHours(turnDate.getHours() - 1);

        setReminderDate(turnDate.toISOString().split('T')[0]);
        setReminderTime(turnDate.toTimeString().slice(0, 5));
    };

    const saveReminder = () => {
        if (reminderModalOpen && onSetReminder) {
            const fullDate = new Date(`${reminderDate}T${reminderTime}`);
            onSetReminder(reminderModalOpen, fullDate.toISOString());
            setReminderModalOpen(null);

            // Request permission immediately
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    };

    if (turns.length === 0) {
        return (
            <div className="text-center text-slate-300 mt-8 p-6 glass-card text-lg">
                <p>No hay turnos agendados.</p>
            </div>
        );
    }

    // Sort turns by date
    const sortedTurns = [...turns].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    return (
        <div className="w-full space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Próximos Turnos</h2>
            {sortedTurns.map((turn) => (
                <div key={turn.id} className="glass-card p-5 relative overflow-hidden transition-all hover:shadow-lg border border-slate-600">
                    {/* Decorative side bar based on status */}
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${turn.completed === true ? 'bg-green-500' :
                        turn.completed === false ? 'bg-red-500' : 'bg-blue-500'
                        }`}></div>

                    <div className="pl-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-xl text-white mb-1">{turn.clientName}</h3>
                                <p className="text-base text-slate-300 font-medium">
                                    {new Date(turn.dateTime).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    {' - '}
                                    <span className="text-white font-bold">{new Date(turn.dateTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {/* Reminder Button */}
                                {onSetReminder && !turn.completed && (
                                    <button
                                        onClick={() => openReminderModal(turn)}
                                        className={`p-2 rounded-full transition-colors ${turn.reminderTime
                                                ? 'text-yellow-400 bg-yellow-900/20 hover:bg-yellow-900/40'
                                                : 'text-slate-400 hover:text-yellow-400 hover:bg-slate-700'
                                            }`}
                                        title={turn.reminderTime ? `Recordatorio: ${new Date(turn.reminderTime).toLocaleString()}` : "Crear recordatorio"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill={turn.reminderTime ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                        </svg>
                                    </button>
                                )}
                                <button
                                    onClick={() => onDelete(turn.id)}
                                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-full transition-colors"
                                    title="Cancelar turno"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {turn.task && (
                            <div className="mb-4 bg-slate-800 p-3 rounded-xl text-base text-slate-200 border border-slate-700">
                                <span className="font-bold text-slate-400 mr-2">Tarea:</span> {turn.task}
                            </div>
                        )}

                        <div className="mb-4 bg-purple-900/30 p-3 rounded-xl text-base flex items-center justify-between border border-purple-500/30">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-purple-300">Precio estimado:</span>
                                {editingId === turn.id ? (
                                    <input
                                        type="number"
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(e.target.value)}
                                        className="w-32 px-3 py-1 text-base bg-slate-900 border border-purple-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="text-white font-bold text-lg">
                                        {turn.estimatedPrice !== undefined ? formatPrice(turn.estimatedPrice) : '-'}
                                    </span>
                                )}
                            </div>

                            {onUpdatePrice && (
                                <div>
                                    {editingId === turn.id ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => savePrice(turn.id)}
                                                className="p-2 text-green-400 hover:bg-green-900/30 rounded-lg transition-colors"
                                                title="Guardar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="Cancelar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startEditing(turn)}
                                            className="p-2 text-purple-300 hover:text-white hover:bg-purple-600/30 rounded-lg transition-colors"
                                            title="Editar precio"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-600">
                            <p className="text-base text-slate-300 mb-3 font-bold">¿Se cumplió el turno?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => onStatusChange(turn.id, true)}
                                    className={`flex-1 py-2 px-4 rounded-xl text-base font-bold transition-all ${turn.completed === true
                                        ? 'bg-green-600 text-white shadow-lg shadow-green-900/20'
                                        : 'bg-slate-700 text-slate-300 hover:bg-green-600/20 hover:text-green-400'
                                        }`}
                                >
                                    Sí
                                </button>
                                <button
                                    onClick={() => onStatusChange(turn.id, false)}
                                    className={`flex-1 py-2 px-4 rounded-xl text-base font-bold transition-all ${turn.completed === false
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                                        : 'bg-slate-700 text-slate-300 hover:bg-red-600/20 hover:text-red-400'
                                        }`}
                                >
                                    No
                                </button>
                            </div>
                        </div>

                        {turn.completed === true && onPaidChange && (
                            <div className="mt-4 pt-4 border-t border-slate-600">
                                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={turn.paid || false}
                                        onChange={(e) => onPaidChange(turn.id, e.target.checked)}
                                        className="w-6 h-6 text-green-500 rounded focus:ring-green-500 bg-slate-800 border-slate-500"
                                    />
                                    <span className="text-lg font-bold text-green-400">Pagado</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Reminder Modal */}
            {reminderModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Programar Recordatorio</h3>
                        <p className="text-slate-400 mb-6 text-sm">
                            Elige cuándo quieres recibir la notificación para avisarle al cliente.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Fecha</label>
                                <input
                                    type="date"
                                    value={reminderDate}
                                    onChange={(e) => setReminderDate(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Hora</label>
                                <input
                                    type="time"
                                    value={reminderTime}
                                    onChange={(e) => setReminderTime(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setReminderModalOpen(null)}
                                className="flex-1 py-2 px-4 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveReminder}
                                className="flex-1 py-2 px-4 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors font-bold"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
