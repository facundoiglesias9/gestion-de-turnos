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
    deposit?: number;
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
    onUpdateDeposit?: (id: string, newDeposit: number) => void;
    onSetReminder?: (id: string, date: string | null) => void;
    onReminderSent?: (id: string) => void;
    onEditTurn?: (turn: Turn) => void;
    onReschedule?: (id: string, newDate: string) => void;
    onUpdateTask?: (id: string, task: string) => void;
}

export default function TurnList({
    turns,
    onDelete,
    onStatusChange,
    onPaidChange,
    onUpdatePrice,
    onUpdateDeposit,
    onSetReminder,
    onReminderSent,
    onEditTurn,
    onReschedule,
    onUpdateTask
}: TurnListProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState<string>('');

    const [editingDepositId, setEditingDepositId] = useState<string | null>(null);
    const [editDepositValue, setEditDepositValue] = useState<string>('');

    // Task Edit State
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editTaskValue, setEditTaskValue] = useState<string>('');

    // Reminder Modal State
    const [reminderModalOpen, setReminderModalOpen] = useState<string | null>(null);
    const [reminderDate, setReminderDate] = useState('');
    const [reminderTime, setReminderTime] = useState('');

    // Reschedule Modal State
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState<string | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');

    // ... (rest of the state)

    const startEditingTask = (turn: Turn) => {
        setEditingTaskId(turn.id);
        setEditTaskValue(turn.task || '');
    };

    const cancelEditingTask = () => {
        setEditingTaskId(null);
        setEditTaskValue('');
    };

    const saveTask = (id: string) => {
        if (onUpdateTask) {
            onUpdateTask(id, editTaskValue);
            setEditingTaskId(null);
        }
    };

    // In-App Notification State
    const [activeNotification, setActiveNotification] = useState<Turn | null>(null);
    const viewedNotifications = React.useRef(new Set<string>());

    // Check for reminders every 2 seconds
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            turns.forEach(turn => {
                // Check if notification was already viewed locally to prevent loop
                if (viewedNotifications.current.has(turn.id)) return;

                if (turn.reminderTime && !turn.reminderSent) {
                    const reminderTime = new Date(turn.reminderTime);
                    // Check if it's time (within the last 5 minutes to be safe)
                    if (now >= reminderTime && now.getTime() - reminderTime.getTime() < 60000 * 5) {
                        // Trigger notification
                        showNotification(turn);

                        // Mark as sent to prevent loop in DB
                        if (onReminderSent) onReminderSent(turn.id);
                    }
                }
            });
        };

        const interval = setInterval(checkReminders, 2000); // Check every 2s
        return () => clearInterval(interval);
    }, [turns, onReminderSent]);

    const showNotification = (turn: Turn) => {
        if (viewedNotifications.current.has(turn.id)) return;

        const turnDate = new Date(turn.dateTime);
        const dateStr = turnDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' });
        const timeStr = turnDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
        const bodyText = `El turno es el ${dateStr} a las ${timeStr} hs.`;

        // 1. Try Service Worker Notification (Best for Android)
        if ('serviceWorker' in navigator && 'Notification' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(`Recordatorio: ${turn.clientName}`, {
                    body: bodyText,
                    icon: '/icon.png',
                    vibrate: [200, 100, 200],
                    tag: 'reminder-' + turn.id,
                    data: { url: `https://wa.me/?text=${encodeURIComponent(`Hola ${turn.clientName}, te recuerdo tu turno...`)}` }
                } as any);
            });
        }
        // 2. Fallback to standard Notification
        else if ('Notification' in window && Notification.permission === 'granted') {
            const notif = new Notification(`Recordatorio: ${turn.clientName}`, {
                body: bodyText,
                icon: '/icon.png'
            });
            notif.onclick = () => {
                window.focus();
                openWhatsApp(turn);
            };
        }

        // 3. Always show In-App Alert (Fail-safe)
        setActiveNotification(turn);
    };

    const handleDismissNotification = () => {
        if (activeNotification) {
            viewedNotifications.current.add(activeNotification.id);
            setActiveNotification(null);
        }
    };

    const openWhatsApp = (turn: Turn) => {
        const date = new Date(turn.dateTime).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
        const time = new Date(turn.dateTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
        const message = `Hola ${turn.clientName}! Te recuerdo que tienes un turno agendado para el ${date} a las ${time} hs. Por favor confirma asistencia. Gracias!`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        handleDismissNotification();
    };

    const formatPrice = (price: number) => {
        return `$${price.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const getRelativeDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const turnDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (turnDay.getTime() === today.getTime()) return 'Hoy';
        if (turnDay.getTime() === tomorrow.getTime()) return 'Mañana';

        return date.toLocaleDateString('es-AR', { weekday: 'long' });
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

    const startEditingDeposit = (turn: Turn) => {
        setEditingDepositId(turn.id);
        setEditDepositValue(turn.deposit?.toString() || '');
    };

    const cancelEditingDeposit = () => {
        setEditingDepositId(null);
        setEditDepositValue('');
    };

    const saveDeposit = (id: string) => {
        if (onUpdateDeposit && editDepositValue) {
            onUpdateDeposit(id, parseFloat(editDepositValue));
            setEditingDepositId(null);
        }
    };

    const openReminderModal = (turn: Turn) => {
        setReminderModalOpen(turn.id);
        const turnDate = new Date(turn.dateTime);
        turnDate.setHours(turnDate.getHours() - 1);

        const localIso = new Date(turnDate.getTime() - (turnDate.getTimezoneOffset() * 60000)).toISOString();
        setReminderDate(localIso.split('T')[0]);

        let minutes = Math.round(turnDate.getMinutes() / 5) * 5;
        if (minutes === 60) minutes = 55;
        const hours = turnDate.getHours().toString().padStart(2, '0');
        const mins = minutes.toString().padStart(2, '0');

        setReminderTime(`${hours}:${mins}`);
    };

    const saveReminder = () => {
        if (reminderModalOpen && onSetReminder) {
            const fullDate = new Date(`${reminderDate}T${reminderTime}`);
            onSetReminder(reminderModalOpen, fullDate.toISOString());
            setReminderModalOpen(null);

            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    };

    const openRescheduleModal = (turn: Turn) => {
        setRescheduleModalOpen(turn.id);
        const dateObj = new Date(turn.dateTime);
        const localIso = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString();
        setRescheduleDate(localIso.split('T')[0]);
        setRescheduleTime(dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };

    const saveReschedule = () => {
        if (rescheduleModalOpen && onReschedule) {
            const fullDate = new Date(`${rescheduleDate}T${rescheduleTime}`);
            onReschedule(rescheduleModalOpen, fullDate.toISOString());
            setRescheduleModalOpen(null);
        }
    };

    if (turns.length === 0) {
        return (
            <div className="text-center text-slate-300 mt-8 p-6 glass-card text-lg">
                <p>No hay turnos agendados.</p>
            </div>
        );
    }

    const sortedTurns = [...turns].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    return (
        <div className="w-full space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Próximos Turnos</h2>

            {/* In-App Notification Banner */}
            {activeNotification && (
                <div className="fixed top-4 left-4 right-4 z-[100] animate-bounce-in">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 shadow-2xl border border-white/20 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">¡Recordatorio de Turno!</h3>
                                    <p className="text-white/90 text-sm">Es hora de avisarle a <span className="font-bold">{activeNotification.clientName}</span>.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDismissNotification}
                                className="text-white/70 hover:text-white p-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <button
                            onClick={() => openWhatsApp(activeNotification)}
                            className="w-full bg-white text-purple-600 font-bold py-3 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.77.46 3.43 1.256 4.89L2 22l5.256-1.256A9.956 9.956 0 0012.004 22c5.524 0 10.004-4.48 10.004-10.004C22.008 6.48 17.528 2 12.004 2zm5.352 14.288c-.22.616-1.268 1.132-1.74 1.16-.472.028-1.084.14-3.792-.932-3.32-1.312-5.46-4.72-5.624-4.94-.164-.22-1.344-1.788-1.344-3.412 0-1.624.848-2.42 1.152-2.752.304-.332.66-.416.88-.416.22 0 .44.004.632.008.2.004.472-.076.74.568.28.672.944 2.304 1.024 2.472.08.168.136.364.028.58-.108.216-.164.352-.324.536-.16.184-.336.412-.48.556-.16.16-.328.336-.14.656.188.32.836 1.364 1.792 2.216 1.224 1.092 2.256 1.436 2.576 1.572.32.136.508.112.7-.108.192-.22.824-.956 1.044-1.284.22-.328.44-.276.74-.164.3.112 1.904.896 2.232 1.06.328.164.548.244.628.38.08.136.08.792-.14 1.408z" />
                            </svg>
                            Abrir WhatsApp
                        </button>
                    </div>
                </div>
            )}

            {sortedTurns.map((turn) => (
                <div key={turn.id} className="glass-card relative overflow-hidden transition-all hover:scale-[1.01] border border-slate-700/50 bg-[#1e1e30]">
                    {/* Status Indicator Stripe */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${turn.completed === true ? 'bg-green-500' :
                        turn.completed === false ? 'bg-red-500' : 'bg-purple-500'
                        }`}></div>

                    <div className="p-4 pl-6">
                        {/* Header: Name and Time */}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-2xl text-white tracking-wide">{turn.clientName}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${getRelativeDateLabel(turn.dateTime) === 'Hoy' ? 'bg-green-900/40 text-green-400' :
                                        getRelativeDateLabel(turn.dateTime) === 'Mañana' ? 'bg-blue-900/40 text-blue-400' :
                                            'bg-slate-700 text-slate-400'
                                        }`}>
                                        {getRelativeDateLabel(turn.dateTime)}
                                    </span>
                                    <span className="text-slate-400 text-sm capitalize font-medium">
                                        {new Date(turn.dateTime).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-bold text-white leading-none">
                                    {new Date(turn.dateTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </span>
                                <span className="text-xs text-slate-500 font-bold uppercase mt-1">Hora</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-slate-700/50 my-3 w-full"></div>

                        {/* Info Grid: Tarea and Money */}
                        <div className="grid grid-cols-[1.2fr_1fr] gap-4 mb-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-slate-500 font-bold uppercase block">Tarea</span>
                                    {onUpdateTask && editingTaskId !== turn.id && (
                                        <button
                                            onClick={() => startEditingTask(turn)}
                                            className="text-slate-500 hover:text-purple-400 p-0.5 rounded transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                                        </button>
                                    )}
                                </div>

                                {editingTaskId === turn.id ? (
                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            value={editTaskValue}
                                            onChange={(e) => setEditTaskValue(e.target.value)}
                                            className="w-full bg-slate-900 border border-purple-500 rounded p-2 text-white text-sm outline-none resize-none"
                                            rows={2}
                                            autoFocus
                                            placeholder="Detalle de tareas..."
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={cancelEditingTask} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded">Cancelar</button>
                                            <button onClick={() => saveTask(turn.id)} className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded font-bold">Guardar</button>
                                        </div>
                                    </div>
                                ) : (
                                    turn.task ? (
                                        <ul className="text-slate-200 font-medium text-sm space-y-1.5">
                                            {turn.task.split('+').map((t, i) => (
                                                <li key={i} className="flex items-start gap-2 leading-tight">
                                                    <span className="text-purple-400 mt-[3px] text-[10px]">●</span>
                                                    <span className="break-words">{t.trim()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-slate-200 font-medium leading-tight text-sm">Sin detalle</p>
                                    )
                                )}
                            </div>

                            {/* Money Section (Right Side) */}
                            <div className="flex flex-col gap-2">
                                {/* Price */}
                                <div className="flex justify-between items-center group cursor-pointer p-1 rounded hover:bg-white/5 transition-colors" onClick={() => startEditing(turn)}>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PRECIO</span>
                                    <div className="flex items-center gap-1.5">
                                        {editingId === turn.id ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={editPrice}
                                                    onChange={(e) => setEditPrice(e.target.value)}
                                                    className="w-20 px-1 py-0.5 text-sm bg-slate-900 border border-purple-500 rounded text-white text-right"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <button onClick={(e) => { e.stopPropagation(); savePrice(turn.id); }} className="text-green-400">✓</button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-white font-bold text-lg tracking-tight">
                                                    {turn.estimatedPrice ? formatPrice(turn.estimatedPrice) : '-'}
                                                </span>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Deposit / Seña */}
                                <div className="flex justify-between items-center group cursor-pointer p-1 rounded hover:bg-white/5 transition-colors" onClick={() => startEditingDeposit(turn)}>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SEÑA</span>
                                    <div className="flex items-center gap-1.5">
                                        {editingDepositId === turn.id ? (
                                            <div className="flex items-center gap-1">
                                                <input type="number" value={editDepositValue} onChange={e => setEditDepositValue(e.target.value)} className="w-16 bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-right text-white text-sm" onClick={(e) => e.stopPropagation()} autoFocus />
                                                <button onClick={(e) => { e.stopPropagation(); saveDeposit(turn.id); }} className="text-green-400">✓</button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className={`${turn.deposit ? 'text-white' : 'text-slate-500'} font-bold text-base tracking-tight`}>
                                                    {turn.deposit ? formatPrice(turn.deposit) : '$0'}
                                                </span>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Balance */}
                                <div className="flex justify-between items-center pt-2 border-t border-slate-700/50 mt-1">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">FALTA</span>
                                    <div className={`font-bold ${(turn.estimatedPrice || 0) - (turn.deposit || 0) <= 0 ? 'text-green-500' : 'text-red-400'}`}>
                                        {formatPrice(Math.max(0, (turn.estimatedPrice || 0) - (turn.deposit || 0)))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                            {/* Status Toggles (Compact) */}
                            <div className="flex bg-slate-800/80 rounded-lg p-1 gap-1">
                                {turn.completed ? (
                                    <>
                                        <button
                                            onClick={() => onStatusChange(turn.id, false)}
                                            className="px-3 py-1.5 rounded-md text-xs font-bold text-slate-400 hover:text-white transition-all bg-slate-700/50"
                                        >
                                            ↩ Volver
                                        </button>
                                        <button
                                            onClick={() => onPaidChange && onPaidChange(turn.id, true)}
                                            className="px-3 py-1.5 rounded-md text-xs font-bold transition-all bg-purple-600 text-white shadow-md hover:bg-purple-500 animate-pulse-slow"
                                        >
                                            $ Cobrar
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => onStatusChange(turn.id, true)}
                                            className="px-3 py-1.5 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white hover:bg-green-600/20 hover:text-green-400"
                                        >
                                            ✓ Listo
                                        </button>
                                        <button
                                            onClick={() => onStatusChange(turn.id, false)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${turn.completed === false ? 'text-red-400' : 'text-slate-400 hover:text-white hover:bg-red-600/20 hover:text-red-400'}`}
                                        >
                                            ✕ No
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Secondary Actions */}
                            <div className="flex items-center gap-1">
                                {/* WhatsApp Reminder */}
                                <button
                                    onClick={() => openWhatsApp(turn)}
                                    className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-800 rounded-full transition-colors"
                                    title="Enviar mensaje"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.77.46 3.43 1.256 4.89L2 22l5.256-1.256A9.956 9.956 0 0012.004 22c5.524 0 10.004-4.48 10.004-10.004C22.008 6.48 17.528 2 12.004 2zm5.352 14.288c-.22.616-1.268 1.132-1.74 1.16-.472.028-1.084.14-3.792-.932-3.32-1.312-5.46-4.72-5.624-4.94-.164-.22-1.344-1.788-1.344-3.412 0-1.624.848-2.42 1.152-2.752.304-.332.66-.416.88-.416.22 0 .44.004.632.008.2.004.472-.076.74.568.28.672.944 2.304 1.024 2.472.08.168.136.364.028.58-.108.216-.164.352-.324.536-.16.184-.336.412-.48.556-.16.16-.328.336-.14.656.188.32.836 1.364 1.792 2.216 1.224 1.092 2.256 1.436 2.576 1.572.32.136.508.112.7-.108.192-.22.824-.956 1.044-1.284.22-.328.44-.276.74-.164.3.112 1.904.896 2.232 1.06.328.164.548.244.628.38.08.136.08.792-.14 1.408z" /></svg>
                                </button>
                                {/* Local Reminder Notifications */}
                                {onSetReminder && !turn.completed && (
                                    <button
                                        onClick={() => openReminderModal(turn)}
                                        className={`p-2 rounded-full transition-colors ${turn.reminderTime ? 'text-yellow-400 bg-yellow-900/10' : 'text-slate-400 hover:text-yellow-400 hover:bg-slate-800'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill={turn.reminderTime ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                                    </button>
                                )}
                                {/* Reschedule */}
                                {onReschedule && (
                                    <button onClick={() => openRescheduleModal(turn)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-full transition-colors" title="Reprogramar">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008H14.25V15zm0 2.25h.008v.008H14.25v-.008zM16.5 15h.008v.008H16.5V15zm0 2.25h.008v.008H16.5v-.008z" /></svg>
                                    </button>
                                )}
                                {/* Delete */}
                                <button onClick={() => onDelete(turn.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-full transition-colors" title="Eliminar">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                </button>
                            </div>
                        </div>
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
                                <label className="block text-sm font-medium text-slate-300 mb-1">Hora (24hs)</label>
                                <div className="flex gap-2">
                                    <select
                                        value={reminderTime.split(':')[0] || '00'}
                                        onChange={(e) => {
                                            const minutes = reminderTime.split(':')[1] || '00';
                                            setReminderTime(`${e.target.value}:${minutes}`);
                                        }}
                                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none appearance-none text-center font-bold text-lg"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(hour => (
                                            <option key={hour} value={hour}>{hour}</option>
                                        ))}
                                    </select>
                                    <span className="text-2xl text-slate-500">:</span>
                                    <select
                                        value={reminderTime.split(':')[1] || '00'}
                                        onChange={(e) => {
                                            const hours = reminderTime.split(':')[0] || '00';
                                            setReminderTime(`${hours}:${e.target.value}`);
                                        }}
                                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none appearance-none text-center font-bold text-lg"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')).map(min => (
                                            <option key={min} value={min}>{min}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
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
                </div>
            )}

            {/* Reschedule Modal */}
            {rescheduleModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Reprogramar Turno</h3>
                        <p className="text-slate-400 mb-6 text-sm">
                            Selecciona la nueva fecha y hora para el turno.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Nueva Fecha</label>
                                <input
                                    type="date"
                                    value={rescheduleDate}
                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Nueva Hora</label>
                                <input
                                    type="time"
                                    value={rescheduleTime}
                                    onChange={(e) => setRescheduleTime(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setRescheduleModalOpen(null)}
                                    className="flex-1 py-2 px-4 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={saveReschedule}
                                    className="flex-1 py-2 px-4 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors font-bold"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
