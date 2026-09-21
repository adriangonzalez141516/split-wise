'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sala, Evento } from '@/lib/types';
import { setEventPayerAction } from '@/actions/eventos.actions';
import { calculateRoomBalance } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface PayerSelectionModuleProps {
  sala: Sala;
  evento: Evento;
}

export default function PayerSelectionModule({ sala, evento }: PayerSelectionModuleProps) {
  const router = useRouter();
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter out the "Bote Común" pseudo-member for payer selection
  const validMembers = sala.members.filter(m => m.id !== 'm_bote');

  // Find the smartest suggestion: the one with the lowest net balance
  const smartSuggestionId = React.useMemo(() => {
    if (validMembers.length === 0) return null;
    
    // Calculate balances across the room (excluding this specific event to avoid circular logic, 
    // though this event might be at 0 total right now anyway)
    const balances = validMembers.map(m => {
      const calc = calculateRoomBalance(sala, m.id);
      return { id: m.id, balance: calc.netBalance };
    });
    
    // Sort ascending, so the most negative balance (owes the most) is first
    balances.sort((a, b) => a.balance - b.balance);
    
    // If everyone is at 0 (first time), return null to default to roulette
    if (balances[0].balance === 0 && balances[balances.length - 1].balance === 0) {
      return null;
    }
    
    return balances[0].id;
  }, [sala, validMembers]);

  const smartSuggestionName = smartSuggestionId 
    ? validMembers.find(m => m.id === smartSuggestionId)?.name 
    : null;

  const handlePayerSelected = async (payerId: string) => {
    setIsUpdating(true);
    try {
      if (payerId) {
        await setEventPayerAction(sala.id, evento.id, payerId);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#FCD34D', '#3B82F6']
        });
      } else {
        // Clear payer case
        await setEventPayerAction(sala.id, evento.id, '');
      }
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const playRoulette = () => {
    if (isSpinning || validMembers.length === 0) return;
    
    setIsSpinning(true);
    let spins = 0;
    const maxSpins = 20 + Math.floor(Math.random() * 10);
    const speed = 100;
    
    const interval = setInterval(() => {
      setHighlightedIndex(prev => (prev + 1) % validMembers.length);
      spins++;
      
      if (spins >= maxSpins) {
        clearInterval(interval);
        // We have a winner!
        const winnerIndex = spins % validMembers.length;
        setHighlightedIndex(winnerIndex);
        setTimeout(() => {
          setIsSpinning(false);
          handlePayerSelected(validMembers[winnerIndex].id);
        }, 800);
      }
    }, speed);
  };

  // If already decided, we just show a subtle summary 
  if (evento.originalPayerId) {
    const payerName = validMembers.find(m => m.id === evento.originalPayerId)?.name || 'Alguien';
    return (
      <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs shadow-sm">
            <span className="material-symbols-outlined text-[16px]">credit_card</span>
          </div>
          <div>
            <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Adelanta la cuenta</p>
            <p className="text-sm font-black text-slate-900">{payerName}</p>
          </div>
        </div>
        <button 
          onClick={() => handlePayerSelected('')}
          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-white px-2 py-1 rounded-lg border border-emerald-200"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col gap-4 relative overflow-hidden">
      {isSpinning && (
        <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] z-10 rounded-3xl" />
      )}
      
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-black text-slate-900 font-heading">¿Quién paga hoy?</h3>
          <p className="text-xs text-slate-500 font-medium">
            Decidid antes de que llegue la cuenta.
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center rotate-12 shadow-xs">
          <span className="material-symbols-outlined text-[18px]">casino</span>
        </div>
      </div>

      {smartSuggestionId ? (
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col gap-3 relative z-20">
          <div className="flex items-center gap-1.5 text-blue-600">
            <span className="material-symbols-outlined text-[16px] filled">tips_and_updates</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">LaRonda Recomienda</span>
          </div>
          <p className="text-xs text-slate-600 leading-tight">
            Según las deudas del grupo, <strong className="text-slate-900 font-black">{smartSuggestionName}</strong> debería pagar esta vez para equilibrar saldos.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePayerSelected(smartSuggestionId)}
              disabled={isUpdating || isSpinning}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-xs font-bold shadow-xs active:scale-95 transition-transform disabled:opacity-50"
            >
              ¡Yo invito!
            </button>
            <button
              onClick={playRoulette}
              disabled={isUpdating || isSpinning}
              className="px-3 bg-white text-slate-700 border border-slate-200 rounded-xl py-2 text-xs font-bold shadow-xs active:scale-95 transition-transform flex items-center gap-1 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">shuffle</span>
              Sortear
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 relative z-20">
          <div className="flex flex-wrap gap-2 justify-center py-2">
            {validMembers.map((m, idx) => (
              <div 
                key={m.id}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-100 ${
                  highlightedIndex === idx 
                    ? 'bg-emerald-500 text-white scale-110 shadow-md ring-2 ring-emerald-200' 
                    : 'bg-slate-100 text-slate-600 opacity-70'
                }`}
              >
                {m.name}
              </div>
            ))}
          </div>
          <button
            onClick={playRoulette}
            disabled={isUpdating || isSpinning}
            className="w-full bg-slate-900 text-white rounded-xl py-3 text-sm font-black shadow-xs active:scale-95 transition-transform flex justify-center items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            Tirar la ruleta
          </button>
        </div>
      )}
    </div>
  );
}
