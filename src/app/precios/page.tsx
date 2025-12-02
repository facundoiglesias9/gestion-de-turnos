"use client";

import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        if (user) {
            loadPrices();
        }
    }, [user]);

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
    };

    const closeModal = () => {
        setShowModal(false);
        setServiceName('');
        setPrice('');
        setEditingId(null);
    };

    if (authLoading || !user) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Lista de Precios</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium"
                >
                    + Agregar Servicio
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500">Cargando...</p>
            ) : prices.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <p className="text-gray-500">No hay servicios en la lista</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Servicio</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Precio</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {prices.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-800">{item.service_name}</td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                                        {formatPrice(item.price)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            {editingId ? 'Editar Servicio' : 'Agregar Servicio'}
                        </h3>
                        <form onSubmit={handleAddPrice} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del Servicio
                                </label>
                                <input
                                    type="text"
                                    value={serviceName}
                                    onChange={(e) => setServiceName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ej: Manicura"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
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
