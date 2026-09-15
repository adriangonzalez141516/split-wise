'use client';

import React, { useState } from 'react';

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

  return (
    <div className="fixed inset-0 z-50 bg-[#111827]/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-[0_12px_32px_-4px_rgba(17,24,39,0.12)] flex flex-col gap-4 border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]" data-icon="workspace_premium">
                workspace_premium
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Pase de Sala Activo</h3>
              <p className="text-xs text-outline">Sala: {roomName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="close">
              close
            </span>
          </button>
        </div>

        {/* Pase Compartido de Sala (4.99 €) */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-emerald-900">Pase Compartido de Sala</span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
              4,99 € (Saldado)
            </span>
          </div>
          <p className="text-xs text-emerald-800/80 leading-relaxed">
            Incluye hasta 20 eventos colaborativos con WebSockets en vivo, IA Gemini 2.5 y optimización Min-Cash-Flow.
            El coste se reparte equitativamente entre los miembros.
          </p>
          <div className="flex items-center justify-between text-xs text-emerald-800 pt-2 border-t border-emerald-200/60 font-medium">
            <span>Consumo actual:</span>
            <span>
              Evento <strong>{eventsUsed}</strong> de <strong>{maxEvents}</strong> utilizados
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full"
              style={{ width: `${(eventsUsed / maxEvents) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Pase Súper-Anfitrión Anual (11.99 €) */}
        <div className="border border-outline-variant/30 rounded-xl p-3.5 flex flex-col gap-2 bg-surface-container-low/40">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-on-surface">Pase Súper-Anfitrión Anual</span>
            <span className="text-sm font-bold text-primary">11,99 € / año</span>
          </div>
          <p className="text-xs text-outline leading-relaxed">
            Salas ilimitadas, IA ilimitada, amortización pasiva de 0,50 € por evento a tu favor y exportación contable a Excel/PDF.
          </p>
          <div className="bg-white/80 p-2 rounded-lg border border-outline-variant/20 text-[11px] text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-sm">share</span>
            <span>
              <strong>Renovación por Viralidad:</strong> 10 invitados registrados = 1 año gratis automático.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setUpgraded(true)}
            className="min-h-[40px] mt-1 w-full py-2 rounded-lg bg-white border border-primary text-primary hover:bg-primary/5 text-xs font-semibold transition-all active:scale-98 shadow-xs"
          >
            {upgraded ? '¡Suscripción Súper-Anfitrión Activada!' : 'Actualizar a Súper-Anfitrión'}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-medium text-sm transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
