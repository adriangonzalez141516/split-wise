'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sala, Member } from '@/lib/types';
import { crearEventoAction } from '@/actions/eventos.actions';

interface CreateEventoModalProps {
  sala: Sala;
  isOpen: boolean;
  onClose: () => void;
  onOpenScan?: (eventoId: string) => void;
}

export default function CreateEventoModal({
  sala,
  isOpen,
  onClose,
  onOpenScan,
}: CreateEventoModalProps) {
  const router = useRouter();
  const [venue, setVenue] = useState('');
  const [title, setTitle] = useState('');
  const [payerId, setPayerId] = useState(sala.members[0]?.id || 'user-carlos');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent, thenScan: boolean = false) => {
    e.preventDefault();
    if (!venue.trim()) return;

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await crearEventoAction(sala.id, {
        venue: venue.trim(),
        title: title.trim() || venue.trim(),
        table: '',
        date: today,
        originalPayerId: payerId,
      });

      if (res.success && res.evento) {
        onClose();
        if (thenScan && onOpenScan) {
          onOpenScan(res.evento.id);
        } else {
          router.push(`/sala/${sala.id}/evento/${res.evento.id}`);
          router.refresh();
        }
      }
    } catch (err) {
      console.error('Error creating event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-evento-title"
      className="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">restaurant</span>
            </div>
            <div>
              <h2 id="create-evento-title" className="text-sm font-black text-slate-900 font-heading">
                Nuevo Evento
              </h2>
              <p className="text-[10px] text-slate-400 truncate">{sala.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="flex flex-col gap-3">
          {/* Venue / Establecimiento */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Restaurante / Bar *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="ej. Taberna Los Ilustres, Grosso Napoletano..."
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600 font-medium transition-colors"
            />
          </div>

          {/* Título opcional */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Título del Evento (opcional)
            </label>
            <input
              type="text"
              placeholder={`ej. Cena Viernes, Comida...`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600 font-medium transition-colors"
            />
          </div>

          {/* Pagador Adelantado / Sugerido */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pagador Principal de la Cuenta
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600 font-semibold text-slate-800 transition-colors"
            >
              {sala.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.isVirtual ? '(Virtual)' : ''}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 block mt-1">
              Quién adelanta el total al camarero/restaurante.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting || !venue.trim()}
              className="w-full h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
            >
              <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
              <span>{isSubmitting ? 'Creando evento...' : 'Crear y Abrir Reparto'}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || !venue.trim()}
              onClick={(e) => handleSubmit(e, true)}
              className="w-full h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 border border-emerald-600/30 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>Crear y Escanear Ticket IA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
