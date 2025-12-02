"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Price {
    id: string;
    service_name: string;
    price: number;
}

export default function PricesPage() {
    const { user, loading: authLoading } = useAuth();
    const [prices, setPrices] = useState<Price[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [serviceName, setServiceName] = useState('');
    const [price, setPrice] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Menu state
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            loadPrices();
        }
    }, [user]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadPrices = async () => {
        if (!user) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('prices')
            .select('*')
            .eq('user_id', user.id)
            .order('service_name', { ascending: true });

        if (error) {
            console.error('Error loading prices:', error);
        } else if (data) {
            setPrices(data);
        }
        setLoading(false);
    };

    const formatPrice = (price: number) => {
        return `$${price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleAddPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !serviceName || !price) return;

        if (editingId) {
            // Update existing price
            const { error } = await supabase
                .from('prices')
                .update({
                    service_name: serviceName.trim(),
                    price: parseFloat(price)
                })
                .eq('id', editingId);

            if (error) {
                console.error('Error updating price:', error);
                alert('Error al actualizar el servicio');
            } else {
                closeModal();
                loadPrices();
            }
        } else {
            // Add new price
            const { error } = await supabase
                .from('prices')
                .insert({
                    user_id: user.id,
                    service_name: serviceName.trim(),
                    price: parseFloat(price)
                });

            if (error) {
                console.error('Error adding price:', error);
                alert('Error al agregar el servicio');
            } else {
                closeModal();
                loadPrices();
            }
        }
    };

    const handleEdit = (item: Price) => {
        setEditingId(item.id);
        setServiceName(item.service_name);
        setPrice(item.price.toString());
        setShowModal(true);
        setOpenMenuId(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;

        const { error } = await supabase
            .from('prices')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting price:', error);
            alert('Error al eliminar el servicio');
        } else {
            loadPrices();
        }
        setOpenMenuId(null);
    };

    const closeModal = () => {
        setShowModal(false);
        setServiceName('');
        setPrice('');
        setEditingId(null);
    };

    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === id ? null : id);
    };

    if (authLoading || !user) return null;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Lista de Precios</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-bold shadow-lg shadow-purple-900/20"
                >
                    + Agregar Servicio
                </button>
            </div>

            {loading ? (
                <p className="text-slate-400 text-center text-lg">Cargando...</p>
            ) : prices.length === 0 ? (
                <div className="text-center py-12 glass-card rounded-xl">
                    <p className="text-slate-300 text-lg">No hay servicios en la lista</p>
                </div>
            ) : (
                <div className="glass-card rounded-xl overflow-visible border border-slate-700/50">
                    <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-slate-700">
                            <tr>
                                <th className="px-4 py-4 text-left text-base font-bold text-slate-200">Servicio</th>
                                <th className="px-4 py-4 text-right text-base font-bold text-slate-200">Precio</th>
                                <th className="px-2 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {prices.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors relative">
                                    <td className="px-4 py-4 text-white font-medium text-lg">{item.service_name}</td>
                                    <td className="px-4 py-4 text-right font-bold text-green-400 text-lg">
                                        {formatPrice(item.price)}
                                    </td>
                                    <td className="px-2 py-4 text-center relative">
                                        <button
                                            onClick={(e) => toggleMenu(item.id, e)}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                                            </svg>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {openMenuId === item.id && (
                                            <div
                                                ref={menuRef}
                                                className="absolute right-8 top-8 z-50 w-36 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-2 border-t border-slate-700"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                    Eliminar
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-6 text-center">
                            {editingId ? 'Editar Servicio' : 'Agregar Servicio'}
                        </h3>
                        <form onSubmit={handleAddPrice} className="space-y-5">
                            <div>
                                <label className="block text-base font-semibold text-slate-300 mb-2">
                                    Nombre del Servicio
                                </label>
                                <input
                                    type="text"
                                    value={serviceName}
                                    onChange={(e) => setServiceName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                                    placeholder="Ej: Manicura"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-base font-semibold text-slate-300 mb-2">
                                    Precio
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-bold"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-3 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors font-medium text-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-bold text-lg shadow-lg shadow-purple-900/20"
                                >
                                    {editingId ? 'Actualizar' : 'Agregar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
