"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';

interface TurnData {
    clientName: string;
    dateTime: string;
    task: string;
    estimatedPrice: number;
}

interface TurnFormProps {
    onAddTurn: (turn: TurnData) => void;
    onUpdateTurn?: (turn: TurnData) => void;
    initialData?: TurnData | null;
    isEditing?: boolean;
    onCancel?: () => void;
}

interface ServiceItem {
    name: string;
    price: number;
}

export default function TurnForm({ onAddTurn, onUpdateTurn, initialData, isEditing, onCancel }: TurnFormProps) {
    const { user } = useAuth();
    const [clientName, setClientName] = useState('');
    const [dateTime, setDateTime] = useState('');

    // Multi-task state
    const [selectedTasks, setSelectedTasks] = useState<ServiceItem[]>([]);
    const [customTaskName, setCustomTaskName] = useState('');
    const [isAddingCustom, setIsAddingCustom] = useState(false);

    const [estimatedPrice, setEstimatedPrice] = useState<string>('');
    const [services, setServices] = useState<{ service_name: string; price: number }[]>([]);

    useEffect(() => {
        if (user) {
            const fetchServices = async () => {
                const { data } = await supabase
                    .from('prices')
                    .select('service_name, price')
                    .eq('user_id', user.id)
                    .order('service_name');

                if (data) {
                    setServices(data);
                }
            };
            fetchServices();
        }
    }, [user]);

    // Update total price when tasks change
    useEffect(() => {
        const total = selectedTasks.reduce((sum, item) => sum + item.price, 0);
        if (total > 0) {
            setEstimatedPrice(total.toString());
        } else if (selectedTasks.length === 0) {
            setEstimatedPrice('');
        }
    }, [selectedTasks]);

    // Populate form if editing
    useEffect(() => {
        if (isEditing && initialData) {
            setClientName(initialData.clientName);
            setDateTime(initialData.dateTime);
            setEstimatedPrice(initialData.estimatedPrice.toString());
            // Treating task as custom for simplicity in edit mode
            setCustomTaskName(initialData.task);
            setIsAddingCustom(true);
            setSelectedTasks([]);
        }
    }, [isEditing, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName || !dateTime || !estimatedPrice) return;

        // Create a Date object from the local input string
        const localDate = new Date(dateTime);

        // Combine task names
        const combinedTask = selectedTasks.length > 0
            ? selectedTasks.map(t => t.name).join(' + ')
            : customTaskName; // Fallback if they only typed in custom input without adding

        const turnData = {
            clientName,
            dateTime: localDate.toISOString(),
            task: combinedTask,
            estimatedPrice: parseFloat(estimatedPrice)
        };

        if (isEditing && onUpdateTurn) {
            onUpdateTurn(turnData);
        } else {
            onAddTurn(turnData);
        }

        // Reset form
        setClientName('');
        setDateTime('');
        setSelectedTasks([]);
        setCustomTaskName('');
        setEstimatedPrice('');
        setIsAddingCustom(false);
    };

    const handleServiceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (!value) return;

        if (value === 'custom') {
            setIsAddingCustom(true);
            // Don't add yet, wait for user input
        } else {
            const service = services.find(s => s.service_name === value);
            if (service) {
                addTask({ name: service.service_name, price: service.price });
            }
        }
        // Reset select
        e.target.value = "";
    };

    const addTask = (task: ServiceItem) => {
        setSelectedTasks([...selectedTasks, task]);
    };

    const removeTask = (index: number) => {
        const newTasks = [...selectedTasks];
        newTasks.splice(index, 1);
        setSelectedTasks(newTasks);
    };

    const addCustomTask = () => {
        if (customTaskName.trim()) {
            addTask({ name: customTaskName.trim(), price: 0 }); // Price 0 for custom, user sets total manually
            setCustomTaskName('');
            setIsAddingCustom(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-card p-6 mb-8 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">{isEditing ? 'Editar Turno' : 'Nuevo Turno'}</h2>

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
                <label className="block text-base font-semibold text-slate-200 mb-2">Tareas</label>

                {/* Selected Tasks List */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTasks.map((task, index) => (
                        <div key={index} className="bg-purple-900/50 border border-purple-500/50 text-purple-100 px-3 py-1 rounded-full flex items-center gap-2">
                            <span className="font-medium">{task.name}</span>
                            <button
                                type="button"
                                onClick={() => removeTask(index)}
                                className="text-purple-300 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                {/* Task Selector */}
                {!isAddingCustom ? (
                    <select
                        onChange={handleServiceSelect}
                        className="input-field text-lg font-medium"
                        defaultValue=""
                    >
                        <option value="" disabled>Agregar servicio...</option>
                        {services.map((service, index) => (
                            <option key={index} value={service.service_name}>
                                {service.service_name} (${service.price})
                            </option>
                        ))}
                        <option value="custom" className="font-bold text-purple-400">+ Otra tarea...</option>
                    </select>
                ) : (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customTaskName}
                            onChange={(e) => setCustomTaskName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addCustomTask();
                                }
                            }}
                            className="input-field text-lg font-medium"
                            placeholder="Escribir tarea..."
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={addCustomTask}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            OK
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAddingCustom(false)}
                            className="px-4 py-2 text-slate-300 hover:text-white bg-slate-700 rounded-lg transition-colors text-lg"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            <div className="mb-8">
                <label htmlFor="price" className="block text-base font-semibold text-slate-200 mb-2">Precio Total Estimado *</label>
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

            <div className="flex gap-2">
                {isEditing && onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600 rounded-lg py-3 font-bold transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                <button type="submit" className="flex-1 btn-primary flex justify-center items-center gap-2 text-lg py-3 font-bold">
                    <span>{isEditing ? 'Guardar Cambios' : 'Agendar Turno'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </button>
            </div>
        </form>
    );
}
