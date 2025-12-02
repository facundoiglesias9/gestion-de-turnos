"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface TurnData {
    clientName: string;
    dateTime: string;
    task: string;
    estimatedPrice: number;
}

interface TurnFormProps {
    onAddTurn: (turn: TurnData) => void;
}

export default function TurnForm({ onAddTurn }: TurnFormProps) {
    const { user } = useAuth();
    const [clientName, setClientName] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [task, setTask] = useState('');
    const [estimatedPrice, setEstimatedPrice] = useState('');
    const [services, setServices] = useState<{ name: string; price: number }[]>([]);
    const [isCustomTask, setIsCustomTask] = useState(false);

    useEffect(() => {
        if (user) {
            const fetchServices = async () => {
                const { data } = await supabase
                    .from('prices')
                    .select('name, price')
                    .eq('user_id', user.id)
                    .order('name');

                if (data) {
                    setServices(data);
                }
            };
            fetchServices();
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName || !dateTime || !estimatedPrice) return;

        onAddTurn({
            clientName,
            dateTime,
            task,
            estimatedPrice: parseFloat(estimatedPrice)
        });

        // Reset form
        setClientName('');
        setDateTime('');
        setTask('');
        setEstimatedPrice('');
        setIsCustomTask(false);
    };

    const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'custom') {
            setIsCustomTask(true);
            setTask('');
            setEstimatedPrice('');
        } else {
            setIsCustomTask(false);
            setTask(value);
            const service = services.find(s => s.name === value);
            if (service) {
                setEstimatedPrice(service.price.toString());
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-card p-6 mb-8 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Nuevo Turno</h2>

            <div className="mb-5">
                <label htmlFor="client" className="block text-base font-semibold text-slate-200 mb-2">Cliente *</label>
                <input
                    id="client"
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className="input-field text-lg font-medium"
                    placeholder="Nombre del cliente"
                />
            </div>

            <div className="mb-5">
                <label htmlFor="date" className="block text-base font-semibold text-slate-200 mb-2">Fecha *</label>
                <input
                    id="date"
                    type="date"
                    value={dateTime.split('T')[0] || ''}
                    onChange={(e) => {
                        const time = dateTime.split('T')[1] || '00:00';
                        setDateTime(`${e.target.value}T${time}`);
                    }}
                    required
                    className="input-field text-lg font-medium"
                />
            </div>

            <div className="mb-5 grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="hour" className="block text-base font-semibold text-slate-200 mb-2">Hora *</label>
                    <select
                        id="hour"
                        value={dateTime.split('T')[1]?.split(':')[0] || ''}
                        onChange={(e) => {
                            const date = dateTime.split('T')[0] || '';
                            const minute = dateTime.split('T')[1]?.split(':')[1] || '00';
                            setDateTime(`${date}T${e.target.value}:${minute}`);
                        }}
                        required
                        className="input-field text-lg font-medium"
                    >
                        <option value="">--</option>
                        {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return <option key={hour} value={hour}>{hour}</option>;
                        })}
                    </select>
                </div>
                <div>
                    <label htmlFor="minute" className="block text-base font-semibold text-slate-200 mb-2">Minutos *</label>
                    <select
                        id="minute"
                        value={dateTime.split('T')[1]?.split(':')[1] || ''}
                        onChange={(e) => {
                            const date = dateTime.split('T')[0] || '';
                            const hour = dateTime.split('T')[1]?.split(':')[0] || '00';
                            setDateTime(`${date}T${hour}:${e.target.value}`);
                        }}
                        required
                        className="input-field text-lg font-medium"
                    >
                        <option value="">--</option>
                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(min => (
                            <option key={min} value={min}>{min}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mb-5">
                <label htmlFor="task" className="block text-base font-semibold text-slate-200 mb-2">Tarea (Opcional)</label>
                {!isCustomTask ? (
                    <select
                        id="task-select"
                        value={task}
                        onChange={handleServiceChange}
                        className="input-field text-lg font-medium"
                    >
                        <option value="">Seleccionar servicio...</option>
                        {services.map((service, index) => (
                            <option key={index} value={service.name}>
                                {service.name}
                            </option>
                        ))}
                        <option value="custom" className="font-bold text-purple-400">+ Otra tarea...</option>
                    </select>
                ) : (
                    <div className="flex gap-2">
                        <input
                            id="task"
                            type="text"
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                            className="input-field text-lg font-medium"
                            placeholder="Escribir tarea..."
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => setIsCustomTask(false)}
                            className="px-4 py-2 text-slate-300 hover:text-white bg-slate-700 rounded-lg transition-colors text-lg"
                            title="Volver a la lista"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            <div className="mb-8">
                <label htmlFor="price" className="block text-base font-semibold text-slate-200 mb-2">Precio Estimado *</label>
                <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(e.target.value)}
                    required
                    className="input-field text-xl font-bold text-green-400"
                    placeholder="0.00"
                />
            </div>

            <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2 text-lg py-3 font-bold">
                <span>Agendar Turno</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>
        </form>
    );
}
