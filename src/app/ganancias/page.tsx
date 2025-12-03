"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Expense {
    id: string;
    description: string;
    amount: number;
    created_at: string;
}

interface CompletedTurn {
    id: string;
    client_name: string;
    date_time: string;
    task: string;
    estimated_price: number;
}

export default function EarningsPage() {
    const { user, loading: authLoading } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [completedTurns, setCompletedTurns] = useState<CompletedTurn[]>([]);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        setLoading(true);

        // Load completed and paid turns
        const { data: turns, error: turnsError } = await supabase
            .from('turns')
            .select('*')
            .eq('user_id', user.id)
            .eq('completed', true)
            .eq('paid', true)
            .order('date_time', { ascending: false });

        if (turnsError) {
            console.error('Error loading turns:', turnsError);
        } else if (turns) {
            setCompletedTurns(turns);
            const total = turns.reduce((sum, turn) => sum + (turn.estimated_price || 0), 0);
            setTotalEarnings(total);
        }

        // Load expenses
        const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (expensesError) {
            console.error('Error loading expenses:', expensesError);
        } else if (expensesData) {
            setExpenses(expensesData);
        }

        setLoading(false);
    };

    const formatPrice = (price: number) => {
        return `$${price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !description || !amount) return;

        const { error } = await supabase
            .from('expenses')
            .insert({
                user_id: user.id,
                description: description.trim(),
                amount: parseFloat(amount)
            });

        if (error) {
            console.error('Error adding expense:', error);
            alert('Error al agregar el gasto');
        } else {
            closeModal();
            loadData();
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este gasto?')) return;

        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting expense:', error);
            alert('Error al eliminar el gasto');
        } else {
            loadData();
        }
    };

    const handleDeleteCompletedTurn = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este trabajo completado? Se eliminará permanentemente.')) return;

        const { error } = await supabase
            .from('turns')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting turn:', error);
            alert('Error al eliminar el trabajo');
        } else {
            loadData();
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setDescription('');
        setAmount('');
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const cashBalance = totalEarnings - totalExpenses;

    if (authLoading || !user) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Ganancias y Gastos</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                    <h3 className="text-sm font-medium opacity-90 mb-2">Ganancias Totales</h3>
                    <p className="text-3xl font-bold">{formatPrice(totalEarnings)}</p>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg">
                    <h3 className="text-sm font-medium opacity-90 mb-2">Gastos Totales</h3>
                    <p className="text-3xl font-bold">{formatPrice(totalExpenses)}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                    <h3 className="text-sm font-medium opacity-90 mb-2">Caja</h3>
                    <p className="text-3xl font-bold">{formatPrice(cashBalance)}</p>
                </div>
            </div>

            {/* Grid with Completed Turns and Expenses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Completed Turns Section */}
                {/* Completed Turns Section */}
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">Trabajos Completados</h3>
                    {loading ? (
                        <p className="text-slate-400">Cargando...</p>
                    ) : completedTurns.length === 0 ? (
                        <div className="text-center py-12 glass-card">
                            <p className="text-slate-400">No hay trabajos completados</p>
                        </div>
                    ) : (
                        <div className="glass-card overflow-hidden max-h-96 overflow-y-auto">
                            <table className="w-full">
                                <thead className="bg-slate-800/50 border-b border-slate-700 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Cliente</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Fecha</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Monto</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {completedTurns.map((turn) => (
                                        <tr key={turn.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3 text-slate-200 font-medium">{turn.client_name}</td>
                                            <td className="px-4 py-3 text-slate-400 text-sm">
                                                {new Date(turn.date_time).toLocaleDateString('es-AR')}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-green-400">
                                                {formatPrice(turn.estimated_price)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDeleteCompletedTurn(turn.id)}
                                                    className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Expenses Section */}
                {/* Expenses Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">Gastos</h3>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                        >
                            + Agregar Gasto
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-slate-400">Cargando...</p>
                    ) : expenses.length === 0 ? (
                        <div className="text-center py-12 glass-card">
                            <p className="text-slate-400">No hay gastos registrados</p>
                        </div>
                    ) : (
                        <div className="glass-card overflow-hidden max-h-96 overflow-y-auto">
                            <table className="w-full">
                                <thead className="bg-slate-800/50 border-b border-slate-700 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Descripción</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Fecha</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Monto</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {expenses.map((expense) => (
                                        <tr key={expense.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3 text-slate-200">{expense.description}</td>
                                            <td className="px-4 py-3 text-slate-400 text-sm">
                                                {new Date(expense.created_at).toLocaleDateString('es-AR')}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-white">
                                                {formatPrice(expense.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                    className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Agregar Gasto</h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Descripción
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                                    placeholder="Ej: Compra de materiales"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Monto
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-bold"
                                >
                                    Agregar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
