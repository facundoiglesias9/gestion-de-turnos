"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';
import Login from '../Login';
import TurnList, { Turn } from '../TurnList';
import TurnForm from '../TurnForm';

// Interfaces
interface Price {
    id: string;
    service_name: string;
    price: number;
}

interface Expense {
    id: string;
    description: string;
    amount: number;
    created_at?: string;
}

type ViewState = 'next_turns' | 'new_turn' | 'prices' | 'stats';

export default function MainPage() {
    const { user, logout, loading: authLoading } = useAuth();

    // Global State
    const [currentView, setCurrentView] = useState<ViewState>('new_turn');
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Data State
    const [turns, setTurns] = useState<Turn[]>([]);
    const [prices, setPrices] = useState<Price[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);

    // Edit State
    const [isEditingTurn, setIsEditingTurn] = useState(false);
    const [editingTurnData, setEditingTurnData] = useState<any>(null);
    const [editingTurnId, setEditingTurnId] = useState<string | null>(null);

    // Business Name Edit State
    const [businessNameModalOpen, setBusinessNameModalOpen] = useState(false);
    const [tempBusinessName, setTempBusinessName] = useState('');

    // Initial Load
    useEffect(() => {
        if (user) {
            loadTurns();
            loadPrices();
            loadExpenses();
        }
    }, [user]);

    // Data Fetching
    const loadTurns = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('turns')
            .select('*')
            .eq('user_id', user.id)
            .order('date_time', { ascending: true });

        if (!error && data) {
            const mappedTurns: Turn[] = data.map((t: any) => ({
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
        } else if (error) {
            console.error('Error loading turns:', error);
        }
    };

    const loadPrices = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('prices')
            .select('*')
            .eq('user_id', user.id)
            .order('service_name');

        if (!error && data) setPrices(data);
    };

    const loadExpenses = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) setExpenses(data);
    };

    // --- Handlers ---

    // Business Name Handler
    const handleUpdateBusinessName = async () => {
        if (!user || !tempBusinessName.trim()) return;

        const { error } = await supabase.auth.updateUser({
            data: { business_name: tempBusinessName.trim() }
        });

        if (error) {
            console.error('Error updating business name:', error);
            alert('Error al actualizar el nombre.');
        } else {
            await supabase.from('profiles').upsert({
                id: user.id,
                email: undefined,
                business_name: tempBusinessName.trim()
            });
            window.location.reload();
        }
    };

    const openBusinessNameModal = () => {
        setTempBusinessName(user?.businessName || '');
        setBusinessNameModalOpen(true);
    };

    const handleNavigation = (view: ViewState) => {
        setCurrentView(view);
        setMenuOpen(false);
        if (view !== 'new_turn') {
            setIsEditingTurn(false);
            setEditingTurnData(null);
            setEditingTurnId(null);
        }
    };

    const handleAddTurn = async (turnData: any) => {
        if (!user) return;
        setLoading(true);

        const dbPayload = {
            user_id: user.id,
            client_name: turnData.clientName,
            date_time: turnData.dateTime,
            task: turnData.task,
            estimated_price: turnData.estimatedPrice,
            completed: false,
            paid: false
        };

        const { error } = await supabase.from('turns').insert(dbPayload);

        if (error) {
            alert('Error al crear turno: ' + error.message);
        } else {
            await loadTurns();
            setCurrentView('next_turns');
        }
        setLoading(false);
    };

    const handleUpdateTurn = async (turnData: any) => {
        if (!editingTurnId) return;
        setLoading(true);

        const dbPayload = {
            client_name: turnData.clientName,
            date_time: turnData.dateTime,
            task: turnData.task,
            estimated_price: turnData.estimatedPrice
        };

        const { error } = await supabase.from('turns')
            .update(dbPayload)
            .eq('id', editingTurnId);

        if (error) {
            alert('Error al actualizar: ' + error.message);
        } else {
            await loadTurns();
            setIsEditingTurn(false);
            setEditingTurnId(null);
            setEditingTurnData(null);
            setCurrentView('next_turns');
        }
        setLoading(false);
    };

    const handleDeleteTurn = async (id: string) => {
        if (!confirm('¿Eliminar turno?')) return;
        const { error } = await supabase.from('turns').delete().eq('id', id);
        if (!error) loadTurns();
    };

    const handleStatusChange = async (id: string, status: boolean) => {
        await supabase.from('turns').update({ completed: status }).eq('id', id);
        loadTurns();
    };

    const handlePaidChange = async (id: string, paid: boolean) => {
        await supabase.from('turns').update({ paid }).eq('id', id);
        loadTurns();
    };

    const handleUpdatePrice = async (id: string, price: number) => {
        await supabase.from('turns').update({ estimated_price: price }).eq('id', id);
        loadTurns();
    };

    const handleUpdateDeposit = async (id: string, deposit: number) => {
        await supabase.from('turns').update({ deposit }).eq('id', id);
        loadTurns();
    };

    const handleSetReminder = async (id: string, date: string | null) => {
        await supabase.from('turns').update({ reminder_time: date }).eq('id', id);
        loadTurns();
    };

    const handleReschedule = async (id: string, date: string) => {
        await supabase.from('turns').update({ date_time: date }).eq('id', id);
        loadTurns();
    };

    const handleEditTurnClick = (turn: Turn) => {
        setIsEditingTurn(true);
        setEditingTurnId(turn.id);
        setEditingTurnData({
            clientName: turn.clientName,
            dateTime: turn.dateTime,
            task: turn.task,
            estimatedPrice: turn.estimatedPrice
        });
        setCurrentView('new_turn');
    };

    const handleAddExpense = async (description: string, amount: number) => {
        if (!user) return;
        const { error } = await supabase.from('expenses').insert({
            user_id: user.id,
            description,
            amount
        });

        if (error) {
            alert('Error al crear gasto');
        } else {
            loadExpenses();
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('¿Eliminar gasto?')) return;
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (!error) loadExpenses();
    };

    const handleUpdateExpense = async (id: string, description: string, amount: number) => {
        const { error } = await supabase.from('expenses').update({ description, amount }).eq('id', id);
        if (!error) loadExpenses();
    };

    // --- Render ---

    if (authLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-purple-500 font-bold">Cargando...</div>;
    if (!user) return <Login />;

    const getTitle = () => {
        switch (currentView) {
            case 'next_turns': return 'Próximos Turnos';
            case 'new_turn': return isEditingTurn ? 'Editar Turno' : 'Agendar Turno';
            case 'prices': return 'Lista de Precios';
            case 'stats': return 'Ganancias y Gastos';
            default: return 'Agendar Turno';
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1020] p-4 text-white font-sans max-w-md mx-auto relative selection:bg-purple-500/30">
            {/* Header */}
            <header className="relative flex flex-col items-center justify-center py-6 mb-2">

                {/* Logout / Admin Top Right */}
                {/* Logout / Admin Top Right */}
                <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-3">
                    {user?.username?.toLowerCase() === 'facundo' && (
                        <span className="bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-500/30 tracking-wider">ADMIN</span>
                    )}
                    <button onClick={logout} className="text-red-500 hover:text-red-400 transition-colors p-2 hover:bg-red-900/10 rounded-full" title="Cerrar Sesión">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                    </button>
                </div>

                {/* Centered Title */}
                <div className="text-center">
                    <h1
                        onClick={openBusinessNameModal}
                        className="text-4xl font-extrabold tracking-tight mb-1 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                    >
                        <span className="bg-gradient-to-r from-white via-purple-100 to-purple-200 text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                            {user.businessName || 'Mi Negocio'}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-purple-400/50 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                    </h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mx-auto rounded-full"></div>
                </div>
            </header>

            {/* Navigation Dropdown Trigger */}
            <div className="relative mb-8 z-50">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-full bg-[#181828] border border-slate-700/50 rounded-2xl p-4 flex items-center shadow-lg active:scale-[0.99] transition-all group"
                >
                    <div className={`p-1 rounded-full text-slate-400 invisible transition-transform duration-300`}>
                        {/* Spacer to balance the centered text */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>

                    <span className="flex-1 text-center text-xl font-bold text-white tracking-wide">{getTitle()}</span>

                    <div className={`p-1 rounded-full text-slate-400 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                </button>

                {menuOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#181828] border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl animate-fade-in-down origin-top">
                        <div className="flex flex-col">
                            <MenuOption label="Agendar Turno" onClick={() => handleNavigation('new_turn')} active={currentView === 'new_turn'} />
                            <MenuOption label="Próximos Turnos" onClick={() => handleNavigation('next_turns')} active={currentView === 'next_turns'} />
                            <MenuOption label="Lista de Precios" onClick={() => handleNavigation('prices')} active={currentView === 'prices'} />
                            <MenuOption label="Ganancias y Gastos" onClick={() => handleNavigation('stats')} active={currentView === 'stats'} />
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="animate-fade-in">
                {currentView === 'next_turns' && (
                    <TurnList
                        turns={turns.filter(t => !t.paid)}
                        onDelete={handleDeleteTurn}
                        onStatusChange={handleStatusChange}
                        onEditTurn={handleEditTurnClick}
                        onReschedule={handleReschedule}
                        onPaidChange={handlePaidChange}
                        onUpdatePrice={handleUpdatePrice}
                        onUpdateDeposit={handleUpdateDeposit}
                        onSetReminder={handleSetReminder}
                    />
                )}

                {currentView === 'new_turn' && (
                    <div className="space-y-4">
                        <TurnForm
                            onAddTurn={handleAddTurn}
                            onUpdateTurn={handleUpdateTurn}
                            initialData={editingTurnData}
                            isEditing={isEditingTurn}
                            onCancel={() => handleNavigation('next_turns')}
                        />
                    </div>
                )}

                {currentView === 'prices' && (
                    <PricesView prices={prices} onReload={loadPrices} user={user} />
                )}

                {currentView === 'stats' && (
                    <StatsView
                        turns={turns}
                        expenses={expenses}
                        onAddExpense={handleAddExpense}
                        onDeleteExpense={handleDeleteExpense}
                        onUpdateExpense={handleUpdateExpense}
                        onPaidChange={handlePaidChange}
                        onDeleteTurn={handleDeleteTurn}
                    />
                )}
            </div>

            {/* Business Name Edit Modal */}
            {businessNameModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white">Nombre del Negocio</h3>
                        <p className="text-slate-400 mb-4 text-sm">Edita el nombre que se muestra en tu perfil.</p>
                        <input
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none mb-6"
                            placeholder="Nombre del emprendimiento"
                            value={tempBusinessName}
                            onChange={e => setTempBusinessName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setBusinessNameModalOpen(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors">Cancelar</button>
                            <button onClick={handleUpdateBusinessName} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white transition-colors">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper Components

const MenuOption = ({ label, onClick, active }: { label: string, onClick: () => void, active: boolean }) => (
    <button
        onClick={onClick}
        className={`w-full text-center px-5 py-4 text-lg border-b border-slate-800 last:border-0 transition-colors ${active ? 'bg-purple-900/20 text-purple-400 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
    >
        {label}
    </button>
);

const PricesView = ({ prices, onReload, user }: { prices: Price[], onReload: () => void, user: any }) => {
    const [showModal, setShowModal] = useState(false);
    const [serviceName, setServiceName] = useState('');
    const [postPrice, setPostPrice] = useState('');

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPriceVal, setEditPriceVal] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('prices').insert({
            user_id: user.id,
            service_name: serviceName,
            price: parseFloat(postPrice)
        });

        if (!error) {
            onReload();
            setShowModal(false);
            setServiceName('');
            setPostPrice('');
        } else {
            console.error(error);
            alert('Error al guardar servicio: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar?')) return;
        await supabase.from('prices').delete().eq('id', id);
        onReload();
    };

    const startEditing = (price: Price) => {
        setEditingId(price.id);
        setEditName(price.service_name);
        setEditPriceVal(price.price.toString());
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName('');
        setEditPriceVal('');
    };

    const handleUpdate = async (id: string) => {
        if (!editName || !editPriceVal) return;

        const { error } = await supabase.from('prices')
            .update({
                service_name: editName,
                price: parseFloat(editPriceVal)
            })
            .eq('id', id);

        if (!error) {
            onReload();
            cancelEditing();
        } else {
            alert('Error al actualizar: ' + error.message);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Lista de Precios</h2>
                <button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all active:scale-95">
                    + Agregar
                </button>
            </div>

            <div className="space-y-2">
                {prices.map(p => (
                    <div key={p.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex justify-between items-center hover:bg-slate-800 transition-colors">
                        {editingId === p.id ? (
                            <div className="flex items-center gap-2 w-full">
                                <div className="flex-1 space-y-2">
                                    <input
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                        placeholder="Nombre"
                                        autoFocus
                                    />
                                    <input
                                        type="number"
                                        value={editPriceVal}
                                        onChange={e => setEditPriceVal(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                        placeholder="Precio"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => handleUpdate(p.id)} className="text-green-400 p-1 hover:bg-slate-700 rounded transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                    </button>
                                    <button onClick={cancelEditing} className="text-red-400 p-1 hover:bg-slate-700 rounded transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <span className="font-medium text-lg text-slate-200">{p.service_name}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-green-400 font-bold text-lg">${p.price.toLocaleString('es-AR')}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => startEditing(p)} className="text-slate-500 hover:text-blue-400 p-1 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                            </svg>
                                        </button>
                                        <button onClick={() => handleDelete(p.id)} className="text-slate-500 hover:text-red-400 p-1 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {prices.length === 0 && <div className="p-8 text-center text-slate-400 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">No hay servicios guardados.</div>}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white">Nuevo Servicio</h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Nombre</label>
                                <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ej. Corte de Pelo" value={serviceName} onChange={e => setServiceName(e.target.value)} required autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Precio</label>
                                <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none" type="number" placeholder="$0" value={postPrice} onChange={e => setPostPrice(e.target.value)} required />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white transition-colors">Guardar</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

const StatsView = ({
    turns,
    expenses,
    onAddExpense,
    onDeleteExpense,
    onUpdateExpense, // New Prop
    onPaidChange,
    onDeleteTurn
}: {
    turns: Turn[],
    expenses: Expense[],
    onAddExpense: (desc: string, amount: number) => void,
    onDeleteExpense: (id: string) => void,
    onUpdateExpense: (id: string, desc: string, amount: number) => void,
    onPaidChange: (id: string, paid: boolean) => void,
    onDeleteTurn: (id: string) => void
}) => {
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null); // For Edit Mode
    const [openMenuId, setOpenMenuId] = useState<string | null>(null); // For Dropdown
    const [openPaidMenuId, setOpenPaidMenuId] = useState<string | null>(null);

    const totalEarnings = turns
        .filter(t => t.paid)
        .reduce((sum, t) => sum + (t.estimatedPrice || 0), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const balance = totalEarnings - totalExpenses;

    const paidTurns = turns.filter(t => t.paid);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (desc && amount) {
            if (editingExpenseId) {
                onUpdateExpense(editingExpenseId, desc, parseFloat(amount));
            } else {
                onAddExpense(desc, parseFloat(amount));
            }
            closeModal();
        }
    };

    const closeModal = () => {
        setDesc('');
        setAmount('');
        setEditingExpenseId(null);
        setShowExpenseModal(false);
    };

    const handleEditClick = (expense: Expense) => {
        setDesc(expense.description);
        setAmount(expense.amount.toString());
        setEditingExpenseId(expense.id);
        setOpenMenuId(null);
        setShowExpenseModal(true);
    };

    const handleDeleteClick = (id: string) => {
        onDeleteExpense(id);
        setOpenMenuId(null);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20" onClick={() => setOpenMenuId(null)}>
            {/* Cards Grid */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-green-600/90 p-5 rounded-3xl shadow-lg shadow-green-900/20">
                    <h3 className="text-green-100 font-medium mb-1 text-sm uppercase tracking-wider">Ganancias Totales</h3>
                    <p className="text-3xl font-bold text-white">${totalEarnings.toLocaleString('es-AR')}</p>
                </div>

                <div className="bg-red-600/90 p-5 rounded-3xl shadow-lg shadow-red-900/20">
                    <h3 className="text-red-100 font-medium mb-1 text-sm uppercase tracking-wider">Gastos Totales</h3>
                    <p className="text-3xl font-bold text-white">${totalExpenses.toLocaleString('es-AR')}</p>
                </div>

                <div className={`p-5 rounded-3xl shadow-lg ${balance >= 0 ? 'bg-blue-600/90 shadow-blue-900/20' : 'bg-orange-600/90 shadow-orange-900/20'}`}>
                    <h3 className={`font-medium mb-1 text-sm uppercase tracking-wider ${balance >= 0 ? 'text-blue-100' : 'text-orange-100'}`}>Caja</h3>
                    <p className="text-3xl font-bold text-white">${balance.toLocaleString('es-AR')}</p>
                </div>
            </div>

            {/* Expenses List Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Últimos Gastos</h3>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowExpenseModal(true); }}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-red-900/20 flex items-center gap-2 transition-all active:scale-95 text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Agregar Gasto
                    </button>
                </div>
                <div className="space-y-3">
                    {expenses.map(e => (
                        <div key={e.id} className="relative bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center group hover:bg-slate-800 transition-colors">
                            <div>
                                <p className="font-bold text-white">{e.description}</p>
                                <p className="text-xs text-slate-500">{new Date(e.created_at || Date.now()).toLocaleDateString('es-AR')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-red-400 font-bold text-lg">-${e.amount.toLocaleString('es-AR')}</span>
                                {/* Three Dots Menu Trigger */}
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setOpenMenuId(openMenuId === e.id ? null : e.id);
                                    }}
                                    className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-700 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {openMenuId === e.id && (
                                    <div className="absolute right-4 top-12 bg-slate-800 border border-slate-700 shadow-xl rounded-xl overflow-hidden z-10 w-32 animate-fade-in-down">
                                        <button
                                            onClick={(event) => { event.stopPropagation(); handleEditClick(e); }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                                            Editar
                                        </button>
                                        <button
                                            onClick={(event) => { event.stopPropagation(); handleDeleteClick(e.id); }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 flex items-center gap-2 border-t border-slate-700/50"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
                                            Eliminar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {expenses.length === 0 && <p className="text-slate-500 text-center py-4 italic">No hay gastos registrados.</p>}
                </div>
            </div>

            {/* Paid Turns List */}
            <div className="pt-6 border-t border-slate-800">
                <h3 className="text-xl font-bold text-white mb-4">Ingresos (Turnos Cobrados)</h3>
                <div className="space-y-3">
                    {paidTurns.map(t => (
                        <div key={t.id} className="bg-slate-800/30 p-4 rounded-xl flex justify-between items-center relative group hover:bg-slate-800 transition-colors">
                            <div>
                                <p className="font-bold text-slate-300">{t.clientName}</p>
                                <p className="text-xs text-slate-500">{new Date(t.dateTime).toLocaleDateString('es-AR')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-green-500/80 font-bold">+${(t.estimatedPrice || 0).toLocaleString('es-AR')}</span>
                                {/* Menu Trigger */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenPaidMenuId(openPaidMenuId === t.id ? null : t.id);
                                    }}
                                    className="p-1 text-slate-500 hover:text-white rounded-full hover:bg-slate-700 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                                    </svg>
                                </button>
                                {/* Dropdown Menu */}
                                {openPaidMenuId === t.id && (
                                    <div className="absolute right-4 top-12 bg-slate-800 border border-slate-700 shadow-xl rounded-xl overflow-hidden z-10 w-48 animate-fade-in-down">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPaidChange(t.id, false);
                                                setOpenPaidMenuId(null);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-yellow-500 hover:bg-slate-700 hover:text-yellow-400 flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                                            Anular Cobro
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteTurn(t.id);
                                                setOpenPaidMenuId(null);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-slate-700 hover:text-red-400 flex items-center gap-2 border-t border-slate-700/50"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                            Eliminar Turno
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {paidTurns.length === 0 && <p className="text-slate-500 text-center py-2 italic text-sm">No hay ingresos registrados aún.</p>}
                </div>
            </div>

            {/* Expense Modal (Create/Edit) */}
            {showExpenseModal && (
                <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white">{editingExpenseId ? 'Editar Gasto' : 'Nuevo Gasto'}</h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Descripción</label>
                                <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ej. Esmaltes" value={desc} onChange={e => setDesc(e.target.value)} required autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Monto</label>
                                <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none" type="number" placeholder="$0" value={amount} onChange={e => setAmount(e.target.value)} required />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white transition-colors">Guardar</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );

};
