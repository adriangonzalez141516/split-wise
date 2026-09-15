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
    : `https://stitch.app/guest/${inviteToken}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111827]/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-xs w-full shadow-[0_12px_32px_-4px_rgba(17,24,39,0.12)] flex flex-col items-center text-center gap-3 border border-outline-variant/30">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[28px]" data-icon="qr_code_2">
            qr_code_2
          </span>
        </div>

        <div>
          <h3 className="text-lg font-bold text-on-surface leading-snug">{tableName}</h3>
          <p className="text-xs text-outline mt-0.5">{roomName}</p>
        </div>

        <p className="text-xs text-on-surface-variant">
          Escanea con la cámara para unirte al instante como <strong className="text-on-surface">Web Guest</strong> sin descargar app ni registrarte.
        </p>

        {/* Minimalist Visual QR Matrix */}
        <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 my-1">
          <div className="w-40 h-40 bg-on-surface rounded-lg flex items-center justify-center text-surface-container-lowest p-2.5">
            <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2 bg-white rounded">
              <div className="bg-black rounded-xs"></div>
              <div className="bg-black rounded-xs"></div>
              <div className="bg-black rounded-xs"></div>
              <div className="bg-transparent"></div>
              <div className="bg-black rounded-xs"></div>

              <div className="bg-black rounded-xs"></div>
              <div className="bg-transparent"></div>
              <div className="bg-black rounded-xs"></div>
              <div className="bg-black rounded-xs"></div>
              <div className="bg-transparent"></div>

              <div className="bg-black rounded-xs"></div>
              <div className="bg-black rounded-xs"></div>
              <div className="bg-transparent"></div>
              <div className="bg-black rounded-xs"></div>
              <div className="bg-black rounded-xs"></div>

              <div className="bg-transparent"></div>
              <div className="bg-black rounded-xs"></div>
              <div className="bg-black rounded-xs"></div>
              <div className="bg-transparent"></div>
              <div className="bg-black rounded-xs"></div>

              <div className="bg-black rounded-xs"></div>
              <div className="bg-transparent"></div>
              <div className="bg-black rounded-xs"></div>
              <div className="bg-black rounded-xs"></div>
              <div className="bg-black rounded-xs"></div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full py-2 px-3 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low text-on-surface text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">
            {copied ? 'check' : 'content_copy'}
          </span>
          <span>{copied ? '¡Enlace copiado!' : 'Copiar enlace de invitación'}</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-medium text-sm transition-colors mt-1"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
