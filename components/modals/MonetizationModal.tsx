'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';

interface MonetizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName?: string;
  eventsUsed?: number;
  maxEvents?: number;
}

export default function MonetizationModal({
  isOpen,
  onClose,
  roomName = 'Cenas de los Viernes',
  eventsUsed = 2,
  maxEvents = 20,
}: MonetizationModalProps) {
  const [upgraded, setUpgraded] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    setUpgraded(true);
    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const pct = Math.min(100, Math.round(((eventsUsed || 0) / (maxEvents || 20)) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="monetization-modal-title"
      className="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-[20px]">
                workspace_premium
              </span>
            </div>
            <div>
              <h3 id="monetization-modal-title" className="text-sm font-black text-slate-900 font-heading">
                Pase de Sala & Suscripciones
              </h3>
              <p className="text-[11px] text-slate-400 truncate">{roomName}</p>
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

        {/* Pase Compartido de Sala (4.99 €) */}
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-emerald-950 font-heading">
              Pase Compartido de Sala
            </span>
            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300/60 whitespace-nowrap">
              4,99 € (Saldado)
            </span>
          </div>

          <p className="text-[11px] text-emerald-800/90 leading-relaxed">
            Incluye hasta 20 eventos con escaneo de ticket con IA, reparto sincronizado y liquidación Min-Cash-Flow.
            El coste se divide a partes iguales entre los miembros.
          </p>

          <div className="flex items-center justify-between text-[11px] text-emerald-900 pt-1 border-t border-emerald-200/60 font-semibold">
            <span>Eventos consumidos:</span>
            <span className="tabular-nums font-bold">
              {eventsUsed} de {maxEvents} ({pct}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-emerald-200/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            ></div>
          </div>
        </div>

        {/* Pase Súper-Anfitrión Anual (11.99 €) */}
        <div className="border border-slate-200 rounded-2xl p-3.5 flex flex-col gap-2.5 bg-slate-50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-900 font-heading">
              Pase Súper-Anfitrión Anual
            </span>
            <span className="text-xs font-black text-emerald-700 tabular-nums whitespace-nowrap">
              11,99 € / año
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Salas y tickets ilimitados, amortización pasiva de 0,50 € por evento y exportación de contabilidad.
          </p>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-[10px] text-slate-600 flex items-center gap-1.5 shadow-2xs">
            <span className="material-symbols-outlined text-emerald-700 text-[16px] shrink-0">
              share
            </span>
            <span>
              <strong>Renovación Viral:</strong> 10 invitados registrados = 1 año gratis automático.
            </span>
          </div>

          <button
            type="button"
            onClick={handleUpgrade}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-98 flex items-center justify-center gap-1.5 ${
              upgraded
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {upgraded ? 'verified' : 'bolt'}
            </span>
            <span>{upgraded ? '¡Suscripción Súper-Anfitrión Activada!' : 'Activar Súper-Anfitrión'}</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
