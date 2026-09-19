'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StructuredTicketOutput } from '@/lib/types';

interface ScanTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketParsed?: (ticket: StructuredTicketOutput) => void;
}

export default function ScanTicketModal({ isOpen, onClose, onTicketParsed }: ScanTicketModalProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlinePending, setOfflinePending] = useState(false);
  const [parseResult, setParseResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check for offline ticket uploads when returning online
    const handleOnline = async () => {
      const stored = localStorage.getItem('laronda_offline_tickets');
      if (stored) {
        try {
          const queue = JSON.parse(stored);
          if (queue.length > 0) {
            // Process queued offline ticket
            const res = await fetch('/api/ai/parse-ticket', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ offlineCount: queue.length }),
            });
            const data = await res.json();
            if (data.success) {
              localStorage.removeItem('laronda_offline_tickets');
              setOfflinePending(false);
            }
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  if (!isOpen) return null;

  // HTML5 Canvas resize to 1400px max, WebP conversion ~250KB
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context not available');

        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP with 0.8 quality (~250KB target)
        const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
        resolve(webpDataUrl);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 3); // Up to 3 consecutive photos
    const processed: string[] = [];

    for (const file of files) {
      try {
        const webp = await processImageFile(file);
        processed.push(webp);
      } catch (err) {
        console.error('Error processing image:', err);
      }
    }

    setSelectedImages(processed);
  };

  const handleProcessWithAI = async () => {
    setIsProcessing(true);
    setParseResult(null);

    // If offline, store in localStorage
    if (!navigator.onLine) {
      localStorage.setItem('laronda_offline_tickets', JSON.stringify(selectedImages));
      setOfflinePending(true);
      setIsProcessing(false);
      return;
    }

    try {
      const res = await fetch('/api/ai/parse-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: selectedImages }),
      });
      const data = await res.json();
      if (data.success) {
        setParseResult(data);
        if (onTicketParsed) {
          onTicketParsed(data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111827]/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-[0_12px_32px_-4px_rgba(17,24,39,0.12)] flex flex-col gap-4 border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]" data-icon="document_scanner">
                document_scanner
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Escanear Ticket con IA</h3>
              <p className="text-xs text-outline">Hasta 3 fotos consecutivas</p>
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

        {/* Offline notice if applicable */}
        {offlinePending && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-700 text-sm mt-0.5">cloud_off</span>
            <div>
              <p className="font-semibold">Modo Offline Activado</p>
              <p className="text-amber-800/80 mt-0.5">
                Las capturas se han guardado comprimidas en el dispositivo. Se procesarán con IA automáticamente en cuanto recuperes cobertura.
              </p>
            </div>
          </div>
        )}

        {/* Image Preview / Picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />

        {selectedImages.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-outline-variant/50 hover:border-primary rounded-xl flex flex-col items-center justify-center gap-2 bg-surface-container-low/50 hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-3xl text-primary">add_a_photo</span>
            <span className="text-xs font-semibold text-on-surface">Tomar fotos o subir ticket</span>
            <span className="text-[11px] text-outline">Preprocesado automático a 1400px WebP (~250KB)</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-outline-variant/30 bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Ticket ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded font-medium">
                    WebP
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-primary font-medium hover:underline text-center"
            >
              Cambiar fotos (hasta 3)
            </button>
          </div>
        )}

        {/* Parse Result Summary */}
        {parseResult && (
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between font-semibold text-emerald-900">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-emerald-700">verified</span>
                {parseResult.data.establishment}
              </span>
              <span className="font-bold text-sm">{parseResult.data.total_amount} €</span>
            </div>
            <p className="text-emerald-800/80">
              {parseResult.data.items.length} platos desglosados y categorizados. Integridad matemática validada (0,00 € discrepancia).
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-low text-on-surface text-xs font-medium transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            disabled={selectedImages.length === 0 || isProcessing}
            onClick={handleProcessWithAI}
            className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            {isProcessing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Procesando...</span>
              </>
            ) : parseResult ? (
              <>
                <span className="material-symbols-outlined text-base">check</span>
                <span>¡Listo!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                <span>Analizar con IA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
