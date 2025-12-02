"use client";

import React, { useState, useEffect } from 'react';
import TurnForm from '@/components/TurnForm';
import TurnList, { Turn } from '@/components/TurnList';
import Login from '@/components/Login';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import PricesPage from '@/app/precios/page';
import EarningsPage from '@/app/ganancias/page';
import InstallPrompt from '@/components/InstallPrompt';

export default function Home() {
  const { user, logout, loading: authLoading } = useAuth();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<'turnos' | 'precios' | 'ganancias'>('turnos');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load turns from Supabase
  useEffect(() => {
    if (!mounted || !user) return;

    const loadTurns = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('turns')
        .select('*')
        .eq('user_id', user.id)
        .order('date_time', { ascending: true });

      if (error) {
        console.error('Error loading turns:', error);
      } else if (data) {
        setTurns(data.map(turn => ({
          id: turn.id,
          userId: turn.user_id,
          clientName: turn.client_name,
          dateTime: turn.date_time,
          task: turn.task,
          completed: turn.completed,
          estimatedPrice: turn.estimated_price,
          paid: turn.paid
        })));
      }
      setLoading(false);
    };

    loadTurns();
  }, [mounted, user]);

  const handleAddTurn = async (data: { clientName: string; dateTime: string; task: string; estimatedPrice: number }) => {
    if (!user) return;

    // Check for existing turn at the same time (exact match)
    const turnExists = turns.some(t => t.dateTime === data.dateTime && !t.completed);
    if (turnExists) {
      alert('Ya existe un turno agendado para esa fecha y hora exacta.');
      return;
    }

    const { data: newTurn, error } = await supabase
      .from('turns')
      .insert({
        user_id: user.id,
        client_name: data.clientName,
        date_time: data.dateTime,
        task: data.task,
        estimated_price: data.estimatedPrice,
        completed: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding turn:', error);
      alert('Error al agregar el turno');
    } else if (newTurn) {
      setTurns([...turns, {
        id: newTurn.id,
        userId: newTurn.user_id,
        clientName: newTurn.client_name,
        dateTime: newTurn.date_time,
        task: newTurn.task,
        completed: newTurn.completed,
        estimatedPrice: newTurn.estimated_price
      }]);
    }
  };

  const handleDeleteTurn = async (id: string) => {
    const { error } = await supabase
      .from('turns')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting turn:', error);
      alert('Error al eliminar el turno');
    } else {
      setTurns(turns.filter(turn => turn.id !== id));
    }
  };

  const handleStatusChange = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('turns')
      .update({ completed })
      .eq('id', id);

    if (error) {
      console.error('Error updating turn:', error);
      alert('Error al actualizar el turno');
    } else {
      setTurns(turns.map(turn =>
        turn.id === id ? { ...turn, completed } : turn
      ));
    }
  };

  const handlePaidChange = async (id: string, paid: boolean) => {
    const { error } = await supabase
      .from('turns')
      .update({ paid })
      .eq('id', id);

    if (error) {
      console.error('Error updating paid status:', error);
      alert('Error al actualizar el estado de pago');
    } else {
      setTurns(turns.map(turn =>
        turn.id === id ? { ...turn, paid } : turn
      ));
    }
  };

  const handleUpdatePrice = async (id: string, newPrice: number) => {
    const { error } = await supabase
      .from('turns')
      .update({ estimated_price: newPrice })
      .eq('id', id);

    if (error) {
      console.error('Error updating price:', error);
      alert('Error al actualizar el precio');
    } else {
      setTurns(turns.map(turn =>
        turn.id === id ? { ...turn, estimatedPrice: newPrice } : turn
      ));
    }
  };

  if (!mounted || authLoading) {
    return null;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-8 border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {user.businessName}
              </h1>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-medium">
                Hola {user.username}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <InstallPrompt />
              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10"
                title="Cerrar Sesión"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-slate-700 mb-6">
            <button
              onClick={() => setActivePage('turnos')}
              className={`px-6 py-3 font-medium transition-all ${activePage === 'turnos'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Turnos
            </button>
            <button
              onClick={() => setActivePage('precios')}
              className={`px-6 py-3 font-medium transition-all ${activePage === 'precios'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Lista de Precios
            </button>
            <button
              onClick={() => setActivePage('ganancias')}
              className={`px-6 py-3 font-medium transition-all ${activePage === 'ganancias'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Ganancias y Gastos
            </button>
          </div>

          {/* Page Content */}
          {activePage === 'turnos' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <TurnForm onAddTurn={handleAddTurn} />
              </div>
              <div>
                {loading ? (
                  <p className="text-slate-400 text-center">Cargando turnos...</p>
                ) : (
                  <TurnList
                    turns={turns.filter(turn => !(turn.completed === true && turn.paid === true))}
                    onDelete={handleDeleteTurn}
                    onStatusChange={handleStatusChange}
                    onPaidChange={handlePaidChange}
                    onUpdatePrice={handleUpdatePrice}
                  />
                )}
              </div>
            </div>
          ) : activePage === 'precios' ? (
            <PricesPage />
          ) : (
            <EarningsPage />
          )}
        </div>
      </div>
    </div>
  );
}
