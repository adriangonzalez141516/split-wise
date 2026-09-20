'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

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
    ? `${window.location.origin}/sala/${inviteToken}/join`
    : `https://laronda.app/sala/${inviteToken}/join`;

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
          <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200/70 flex items-center justify-center aspect-square">
            <QRCodeSVG
              value={inviteUrl}
              size={180}
              bgColor={"#ffffff"}
              fgColor={"#0f172a"}
              level={"M"}
              includeMargin={false}
              className="w-44 h-44"
            />
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

        {/* WhatsApp Share button */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Únete a la mesa en LaRonda: ${inviteUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm active:scale-[0.99]"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
          <span>Enviar invitación por WhatsApp</span>
        </a>

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
