'use client';

import React, { useState } from 'react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName?: string;
  tableName?: string;
  inviteToken?: string;
}

export default function QrModal({
  isOpen,
  onClose,
  roomName = 'Cenas de los Viernes',
  tableName = 'Mesa 14 • Taberna Los Ilustres',
  inviteToken = 'token-guest-mesa14',
}: QrModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/sala/cenas-viernes/evento/taberna-ilustres?guest_token=${inviteToken}`
    : `https://laronda.app/guest/${inviteToken}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center gap-4 relative animate-in zoom-in-95 duration-200">
        
        {/* Close button X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
          <span className="material-symbols-outlined text-2xl">
            qr_code_2
          </span>
        </div>

        {/* Title */}
        <div className="px-2">
          <h3 className="text-lg font-bold text-slate-900 leading-tight">{tableName}</h3>
          <p className="text-xs font-medium text-slate-400 mt-1">{roomName}</p>
        </div>

        {/* Realistic SVG QR Code Display */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner flex flex-col items-center">
          <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200/70">
            <svg
              className="w-44 h-44"
              viewBox="0 0 140 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Corner 1: Top-Left */}
              <rect x="10" y="10" width="36" height="36" rx="6" fill="#0f172a" />
              <rect x="16" y="16" width="24" height="24" rx="3" fill="#ffffff" />
              <rect x="22" y="22" width="12" height="12" rx="2" fill="#0f172a" />

              {/* Corner 2: Top-Right */}
              <rect x="94" y="10" width="36" height="36" rx="6" fill="#0f172a" />
              <rect x="100" y="16" width="24" height="24" rx="3" fill="#ffffff" />
              <rect x="106" y="22" width="12" height="12" rx="2" fill="#0f172a" />

              {/* Corner 3: Bottom-Left */}
              <rect x="10" y="94" width="36" height="36" rx="6" fill="#0f172a" />
              <rect x="16" y="100" width="24" height="24" rx="3" fill="#ffffff" />
              <rect x="22" y="106" width="12" height="12" rx="2" fill="#0f172a" />

              {/* Data Blocks / Matrix Simulation */}
              <rect x="54" y="14" width="8" height="8" rx="1.5" fill="#0f172a" />
              <rect x="68" y="14" width="8" height="8" rx="1.5" fill="#0f172a" />
              <rect x="78" y="24" width="8" height="8" rx="1.5" fill="#0f172a" />
              <rect x="54" y="34" width="16" height="8" rx="1.5" fill="#0f172a" />

              <rect x="14" y="54" width="8" height="14" rx="1.5" fill="#0f172a" />
              <rect x="30" y="58" width="8" height="8" rx="1.5" fill="#0f172a" />
              <rect x="42" y="52" width="10" height="10" rx="2" fill="#10b981" />
              <rect x="60" y="54" width="8" height="8" rx="1.5" fill="#0f172a" />
              <rect x="74" y="50" width="12" height="12" rx="2" fill="#0f172a" />
              <rect x="94" y="54" width="8" height="8" rx="1.5" fill="#0f172a" />
              <rect x="110" y="54" width="16" height="8" rx="1.5" fill="#0f172a" />

              <rect x="14" y="76" width="8" height="8" rx="1.5" fill="#0f172a" />
              <rect x="30" y="74" width="8" height="8" rx="1.5" fill="#0f172a" />
              <rect x="48" y="72" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="64" y="70" width="14" height="8" rx="1.5" fill="#10b981" />
              <rect x="84" y="74" width="8" height="14" rx="1.5" fill="#0f172a" />
              <rect x="100" y="70" width="8" height="8" rx="1.5" fill="#0f172a" />
              <rect x="116" y="76" width="10" height="8" rx="1.5" fill="#0f172a" />

              <rect x="54" y="94" width="8" height="16" rx="1.5" fill="#0f172a" />
              <rect x="68" y="94" width="14" height="8" rx="1.5" fill="#0f172a" />
              <rect x="90" y="94" width="8" height="8" rx="1.5" fill="#0f172a" />
              <rect x="106" y="94" width="12" height="8" rx="1.5" fill="#0f172a" />
              <rect x="68" y="112" width="8" height="14" rx="1.5" fill="#0f172a" />
              <rect x="84" y="116" width="14" height="8" rx="1.5" fill="#0f172a" />
              <rect x="106" y="112" width="18" height="14" rx="2" fill="#0f172a" />
            </svg>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Modo Web Guest sin registro
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed px-2">
          Escanea con cualquier cámara de móvil para unirte a la mesa al instante y repartir consumos.
        </p>

        {/* Copy link button */}
        <button
          type="button"
          onClick={handleCopyLink}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            copied
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 active:scale-[0.99]'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {copied ? 'check' : 'content_copy'}
          </span>
          <span>{copied ? '¡Enlace copiado al portapapeles!' : 'Copiar enlace directo de invitación'}</span>
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
