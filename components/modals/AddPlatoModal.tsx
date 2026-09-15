'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ItemCategory, Member, TicketItem } from '@/lib/types';
import { anadirPlatoAction, anadirPlatosDesdeTicketAction } from '@/actions/eventos.actions';

interface AddPlatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  salaId: string;
  eventoId: string;
  members: Member[];
  currentUserId?: string;
  onDishAdded?: (item: TicketItem) => void;
  onMultipleDishesAdded?: (items: TicketItem[]) => void;
}

const CATEGORIES: { id: ItemCategory; label: string; icon: string; bg: string; text: string }[] = [
  { id: 'food', label: 'Comida', icon: 'restaurant', bg: 'bg-slate-100', text: 'text-slate-800' },
  { id: 'standard_drink', label: 'Refresco', icon: 'local_cafe', bg: 'bg-blue-50', text: 'text-blue-800' },
  { id: 'alcohol', label: 'Alcohol', icon: 'wine_bar', bg: 'bg-amber-100', text: 'text-amber-900' },
  { id: 'dessert', label: 'Postre', icon: 'cake', bg: 'bg-pink-100', text: 'text-pink-900' },
  { id: 'service', label: 'Servicio', icon: 'room_service', bg: 'bg-purple-50', text: 'text-purple-900' },
];

const SAMPLE_TICKETS = [
  {
    id: 't-raciones',
    title: 'Raciones y Tapas',
    venue: 'Taberna Los Ilustres',
    items: [
      { name: 'Pimientos de Padrón', quantity: 1, unit_price: 8.5, category: 'food' as const },
      { name: 'Gambas al Ajillo', quantity: 1, unit_price: 16.0, category: 'food' as const },
      { name: 'Caña Estrella Galicia (x3)', quantity: 3, unit_price: 3.0, category: 'alcohol' as const },
    ],
  },
  {
    id: 't-marisco',
    title: 'Platos Principales',
    venue: 'Asador Central',
    items: [
      { name: 'Solomillo al Foie', quantity: 1, unit_price: 26.5, category: 'food' as const },
      { name: 'Vino Blanco Albariño', quantity: 1, unit_price: 21.0, category: 'alcohol' as const },
      { name: 'Coulant de Chocolate', quantity: 2, unit_price: 6.5, category: 'dessert' as const },
    ],
  },
];

export default function AddPlatoModal({
  isOpen,
  onClose,
  salaId,
  eventoId,
  members,
  currentUserId = 'user-carlos',
  onDishAdded,
  onMultipleDishesAdded,
}: AddPlatoModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai_scan'>('manual');

  // Manual Form State
  const [name, setName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState<ItemCategory>('food');
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([currentUserId]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Scan State
  const [selectedTicketSample, setSelectedTicketSample] = useState(SAMPLE_TICKETS[0]);
  const [scanStep, setScanStep] = useState<'idle' | 'preprocessing' | 'inferring' | 'done'>('idle');
  const [scannedItems, setScannedItems] = useState<Omit<TicketItem, 'id'>[]>([]);

  if (!isOpen) return null;

  // Toggle member assignment in manual creation
  const toggleMemberAssignment = (memberId: string) => {
    setAssignedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    if (assignedMemberIds.length === members.length) {
      setAssignedMemberIds([currentUserId]);
    } else {
      setAssignedMemberIds(members.map((m) => m.id));
    }
  };

  // Submit manual dish
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(unitPrice.replace(',', '.'));
    if (!name.trim() || isNaN(priceNum) || priceNum <= 0) return;

    setIsSubmitting(true);
    try {
      const dishData: Omit<TicketItem, 'id'> = {
        name: name.trim(),
        unit_price: priceNum,
        quantity: Math.max(1, quantity),
        total_price: Math.round(priceNum * Math.max(1, quantity) * 100) / 100,
        category,
        assignedMemberIds: assignedMemberIds.length > 0 ? assignedMemberIds : [currentUserId],
      };

      const res = await anadirPlatoAction(salaId, eventoId, dishData);
      if (res.success && res.item) {
        if (onDishAdded) onDishAdded(res.item);
        try {
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        } catch {}
        onClose();
        // Reset form
        setName('');
        setUnitPrice('');
        setQuantity(1);
        setCategory('food');
        setAssignedMemberIds([currentUserId]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate AI Scan pipeline
  const handleStartAiScan = async () => {
    setScanStep('preprocessing');
    await new Promise((r) => setTimeout(r, 600));

    setScanStep('inferring');
    await new Promise((r) => setTimeout(r, 1200));

    // Prepare extracted items assigned to all members by default
    const allMemberIds = members.map((m) => m.id);
    const extracted: Omit<TicketItem, 'id'>[] = selectedTicketSample.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: Math.round(i.quantity * i.unit_price * 100) / 100,
      category: i.category,
      assignedMemberIds: i.category === 'alcohol' ? [currentUserId] : allMemberIds,
    }));

    setScannedItems(extracted);
    setScanStep('done');
  };

  // Confirm extracted items into event
  const handleConfirmAiItems = async () => {
    if (scannedItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await anadirPlatosDesdeTicketAction(salaId, eventoId, scannedItems);
      if (res.success) {
        if (onMultipleDishesAdded) onMultipleDishesAdded(res.items);
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
        } catch {}
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setScanStep('idle');
      setScannedItems([]);
    }
  };

  const parsedPrice = parseFloat(unitPrice.replace(',', '.')) || 0;
  const totalAmount = Math.round(parsedPrice * quantity * 100) / 100;
  const sharePerMember =
    assignedMemberIds.length > 0
      ? Math.round((totalAmount / assignedMemberIds.length) * 100) / 100
      : totalAmount;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 flex flex-col gap-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-[22px]">add_circle</span>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">Añadir Platos al Ticket</h3>
              <p className="text-[11px] text-slate-500 font-medium">Reparto colaborativo en mesa</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`h-9 flex-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">edit_note</span>
            <span>Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_scan')}
            className={`h-9 flex-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ai_scan'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px] text-emerald-600">auto_awesome</span>
            <span>Escanear Ticket IA</span>
          </button>
        </div>

        {/* ================= TAB 1: MANUAL ADD ================= */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3.5">
            {/* Dish Name */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Nombre del plato o consumición
              </label>
              <input
                type="text"
                required
                placeholder="ej. Tortilla de Patatas, Bravas, Entrecot"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600 transition-colors font-medium text-slate-900"
              />
            </div>

            {/* Price & Quantity Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Precio unitario (€)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="12,50"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600 transition-colors font-bold text-slate-900"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">€</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Raciones / Cantidad
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden h-[42px]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-full flex items-center justify-center text-slate-600 hover:bg-slate-200 text-sm font-black transition-colors"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-xs font-black text-slate-900 tabular-nums font-heading">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-full flex items-center justify-center text-slate-600 hover:bg-slate-200 text-sm font-black transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Category Selector Chips */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Categoría
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`h-8 px-2.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                      category === cat.id
                        ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-600/30'
                        : `${cat.bg} ${cat.text} hover:opacity-80`
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
              {category === 'alcohol' && (
                <p className="text-[10px] text-amber-800 bg-amber-50 rounded-lg p-2 mt-1.5 border border-amber-200">
                  Los comensales con el filtro <strong>"No tomo alcohol"</strong> quedarán automáticamente exentos de este coste.
                </p>
              )}
            </div>

            {/* Member Assignees */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  ¿Quién lo comparte?
                </label>
                <button
                  type="button"
                  onClick={selectAllMembers}
                  className="text-[11px] text-emerald-700 font-bold hover:underline"
                >
                  {assignedMemberIds.length === members.length ? 'Solo yo' : 'Todos'}
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {members.map((m) => {
                  const isSelected = assignedMemberIds.includes(m.id);
                  const isSelf = m.id === currentUserId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMemberAssignment(m.id)}
                      className={`h-8 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 ring-1 ring-emerald-300'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isSelected ? 'check' : 'add'}
                      </span>
                      <span>{isSelf ? 'Tú' : m.alias || m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Share Preview Box */}
            {parsedPrice > 0 && (
              <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Cuota resultante
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    {totalAmount.toFixed(2)} € entre {assignedMemberIds.length} comensal/es
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-800 tabular-nums font-heading block">
                    {sharePerMember.toFixed(2).replace('.', ',')} €
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">por comensal</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || parsedPrice <= 0}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
              >
                <span className="material-symbols-outlined text-[17px]">add</span>
                <span>{isSubmitting ? 'Añadiendo...' : 'Añadir Plato'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= TAB 2: AI SCAN SIMULATOR ================= */}
        {activeTab === 'ai_scan' && (
          <div className="flex flex-col gap-3.5">
            <p className="text-xs text-slate-500 leading-relaxed">
              Elige un ticket de muestra o simula la extracción multimodal mediante Gemini 2.5 Flash:
            </p>

            {/* Sample Ticket Presets */}
            <div className="flex flex-col gap-2">
              {SAMPLE_TICKETS.map((t) => {
                const isSelected = selectedTicketSample.id === t.id;
                const totalSample = t.items.reduce((acc, curr) => acc + curr.unit_price * curr.quantity, 0);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTicketSample(t);
                      setScanStep('idle');
                      setScannedItems([]);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 font-heading block">{t.title}</span>
                      <span className="text-[10px] text-slate-500">{t.items.length} platos desglosados</span>
                    </div>
                    <span className="text-xs font-black text-emerald-700 tabular-nums font-heading">
                      +{totalSample.toFixed(2).replace('.', ',')} €
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Animated Laser Scan Box */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 p-4 text-center text-white flex flex-col items-center justify-center min-h-[140px]">
              {scanStep === 'idle' && (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-3xl">document_scanner</span>
                  <p className="text-xs font-bold text-slate-200">Ticket listo para digitalizar</p>
                  <span className="text-[10px] text-slate-400">
                    Formato WebP 1400px • Esquema estructurado JSON
                  </span>
                </div>
              )}

              {scanStep === 'preprocessing' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-emerald-300">Comprimiendo en Canvas a WebP (~250KB)...</p>
                </div>
              )}

              {scanStep === 'inferring' && (
                <div className="flex flex-col items-center gap-2 relative w-full">
                  {/* Glowing Laser Scan Beam */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse"></div>
                  <span className="material-symbols-outlined text-emerald-300 text-3xl animate-bounce">auto_awesome</span>
                  <p className="text-xs font-bold text-emerald-200">Inferencia Gemini 2.5 Flash (1.8s)...</p>
                  <span className="text-[10px] text-slate-400">Verificando suma cero e integridad</span>
                </div>
              )}

              {scanStep === 'done' && (
                <div className="flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-emerald-400 text-3xl">verified</span>
                  <p className="text-xs font-black text-emerald-300">¡Ticket Extraído con Éxito!</p>
                  <span className="text-[10px] text-slate-300">Integridad validada (0,00 € discrepancia)</span>
                </div>
              )}
            </div>

            {/* Extracted Dishes List Preview */}
            {scannedItems.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col gap-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Platos detectados en el ticket:
                </span>
                <div className="divide-y divide-slate-200/60">
                  {scannedItems.map((item, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-500">{item.quantity} ud/s</span>
                      </div>
                      <span className="font-black text-slate-900 tabular-nums">
                        {item.total_price.toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>

              {scanStep === 'done' ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmAiItems}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[17px]">done_all</span>
                  <span>{isSubmitting ? 'Guardando...' : 'Confirmar Platos'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={scanStep !== 'idle'}
                  onClick={handleStartAiScan}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[17px]">document_scanner</span>
                  <span>Escanear con IA</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
