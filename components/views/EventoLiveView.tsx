'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Evento, Sala, TicketItem } from '@/lib/types';
import QrModal from '@/components/modals/QrModal';
import MonetizationModal from '@/components/modals/MonetizationModal';
import AddPlatoModal from '@/components/modals/AddPlatoModal';
import { toggleItemClaimAction } from '@/actions/eventos.actions';
import { actualizarEstadoBizumAction } from '@/actions/liquidacion.actions';

interface EventoLiveViewProps {
  sala: Sala;
  evento: Evento;
  currentUserId: string;
}

export default function EventoLiveView({ sala, evento, currentUserId }: EventoLiveViewProps) {
  const [activeTab, setActiveTab] = useState<'ticket' | 'balance' | 'settle'>('ticket');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showMonetizationModal, setShowMonetizationModal] = useState(false);
  const [showAddPlatoModal, setShowAddPlatoModal] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Local optimistic state for dishes
  const [items, setItems] = useState<TicketItem[]>(evento.items);
  const [transactions, setTransactions] = useState(evento.transactions);

  // Sync state if server props change (revalidación o navegación)
  useEffect(() => {
    setItems(evento.items);
  }, [evento.items]);

  useEffect(() => {
    setTransactions(evento.transactions);
  }, [evento.transactions]);

  const [localEvento, setLocalEvento] = useState<Evento>(evento);

  const currentUserMember = sala.members.find(
    (m) =>
      m.id === currentUserId ||
      m.registeredUserId === currentUserId
  );
  // targetId already resolves correctly via currentUserId prop

  // Toggle item claim
  const handleToggleClaim = async (itemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const isAssigned = item.assignedMemberIds.includes(currentUserId);
          const newAssigned = isAssigned
            ? item.assignedMemberIds.filter((id) => id !== currentUserId)
            : [...item.assignedMemberIds, currentUserId];
          return { ...item, assignedMemberIds: newAssigned };
        }
        return item;
      })
    );

    // API Call
    await toggleItemClaimAction(sala.id, evento.id, itemId, currentUserId);
  };

  // Confirm transaction settlement with confetti
  const handleConfirmPayment = async (txId: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'consolidado' } : t))
    );

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.75 },
      });
    } catch {
      // ignore
    }

    await actualizarEstadoBizumAction(sala.id, evento.id, txId, 'consolidado');
  };

  // Copy Bizum phone
  const copyBizum = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 1800);
  };

  // WhatsApp helpers
  const shareWhatsApp = (name: string, amount: string | number) => {
    const text = encodeURIComponent(
      `Hola ${name}, en LaRonda (Sala: ${sala.name} / Evento: ${evento.venue}) te toca enviar ${amount}€ por Bizum.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareEntireTable = () => {
    const text = encodeURIComponent(
      `🍽️ Resumen de ${evento.venue} (${evento.table || 'Mesa 14'}):\nSala: ${sala.name}\nTotal Ticket: ${evento.totalAmount.toFixed(2)} €\nPagador Sugerido: Mateo\nLiquidación optimizada con LaRonda lista.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Recalculate Carlos's current personal consumption
  const calculatePersonalConsumption = (): number => {
    let total = 0;
    for (const item of items) {
      if (item.assignedMemberIds.includes(currentUserId)) {
        const count = item.assignedMemberIds.length;
        if (count > 0) total += item.total_price / count;
      }
    }
    return Math.round(total * 100) / 100;
  };

  const personalConsumption = calculatePersonalConsumption();
  const assignedItemsCount = items.filter((i) => i.assignedMemberIds.includes(currentUserId)).length;

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-32 pt-2 flex flex-col gap-4">
      {/* Top Header con Jerarquía Completa: Sala > Evento > En Vivo */}
      <header className="sticky top-0 z-30 fintech-header py-2.5 -mx-4 px-4 border-b border-slate-200/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <Link
            href={`/sala/${sala.id}`}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate leading-none">
              {sala.name} • Evento #2
            </div>
            <div className="flex items-center gap-1.5 mt-1 min-w-0">
              <h1 className="text-sm font-black text-slate-900 tracking-tight font-heading truncate leading-none">
                {evento.venue}
              </h1>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 shrink-0">
                {evento.table || 'Mesa 14'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="text-[10px] text-emerald-700 font-bold leading-none">
                Sincronizado en vivo
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          aria-label="Invitar comensales QR"
          className="h-9 px-3 rounded-xl bg-white border border-slate-200/90 text-emerald-800 font-bold text-xs flex items-center gap-1.5 shadow-2xs shrink-0 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
          <span className="whitespace-nowrap">Mesa QR</span>
        </button>
      </header>

      {/* Tarjeta Resumen Calm Live Summary */}
      <div className="fintech-card p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                Total Ticket en Mesa
              </span>
              <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200/60 whitespace-nowrap">
                <span className="material-symbols-outlined text-[12px]">verified</span> IA Cuadrado
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums font-heading whitespace-nowrap">
                {evento.totalAmount.toFixed(2).replace('.', ',')} €
              </span>
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                {sala.members.length} comensales
              </span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl px-2.5 py-1.5 text-right flex flex-col items-end shrink-0 shadow-2xs">
            <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider whitespace-nowrap">
              Tu consumo
            </span>
            <span className="text-base font-black text-emerald-700 tabular-nums font-heading whitespace-nowrap leading-tight mt-0.5">
              {personalConsumption.toFixed(2).replace('.', ',')} €
            </span>
            <span className="text-[9px] text-emerald-700 font-medium whitespace-nowrap mt-0.5">
              {assignedItemsCount} platos
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex -space-x-1.5 overflow-hidden items-center">
            {sala.members.map((m) => (
              <div
                key={m.id}
                className={`w-6 h-6 rounded-full ring-2 ring-white flex items-center justify-center text-[9px] font-bold shadow-2xs ${
                  m.id === currentUserId
                    ? 'bg-slate-200 text-slate-900 font-black'
                    : m.isVirtual
                    ? 'bg-amber-100 text-amber-900 border border-dashed border-amber-300'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
                title={m.name}
              >
                {m.id === currentUserId ? 'Tú' : m.name.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">{sala.members.length} comensales activos</span>
        </div>
      </div>

      {/* Segmented Tabs: Platos | Mi Cuota | Cierre */}
      <section aria-label="Navegación de secciones de cuenta" className="bg-slate-200/60 p-1 rounded-2xl flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('ticket')}
          className={`h-9 flex-1 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
            activeTab === 'ticket'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">receipt_long</span>
          <span>Platos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('balance')}
          className={`h-9 flex-1 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
            activeTab === 'balance'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">person</span>
          <span>Mi Cuota</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settle')}
          className={`h-9 flex-1 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
            activeTab === 'settle'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">payments</span>
          <span>Cierre</span>
        </button>
      </section>

      {/* ==================== TAB 1: REPARTO & PLATOS ==================== */}
      {activeTab === 'ticket' && (
        <div className="flex flex-col gap-3">
          {/* Helper hint */}
          <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400 font-medium py-0.5 whitespace-nowrap">
            <span className="material-symbols-outlined text-[14px]">touch_app</span>
            <span>Toca para asignarte a tus platos</span>
          </div>

          {/* Header de Lista de Platos con botón Añadir Plato / Escanear Ticket */}
          <div className="flex items-center justify-between gap-2 pt-1 pb-0.5">
            <div>
              <h3 className="text-xs font-black text-slate-900 font-heading uppercase tracking-wider">
                Platos en Mesa ({items.length})
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Asignados colaborativamente</span>
            </div>

            <button
              type="button"
              onClick={() => setShowAddPlatoModal(true)}
              className="h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Añadir Plato</span>
            </button>
          </div>

          {/* Lista de Platos Extraídos con IA */}
          <div className="flex flex-col gap-2.5">
            {items.map((item) => {
              const isClaimed = item.assignedMemberIds.includes(currentUserId);
              const assignedCount = item.assignedMemberIds.length || 1;
              const unitShare = Math.round((item.total_price / assignedCount) * 100) / 100;

              return (
                <article
                  key={item.id}
                  className="fintech-card p-3.5 transition-all flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        type="button"
                        aria-label={`Incluirme en ${item.name}`}
                        onClick={() => handleToggleClaim(item.id)}
                        className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                          isClaimed
                            ? 'border-emerald-700 bg-emerald-700 text-white shadow-xs'
                            : 'border-slate-300 hover:border-emerald-600 text-transparent bg-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[17px]">check</span>
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-bold text-slate-900 leading-tight font-heading truncate">
                            {item.name}
                          </h3>
                          <span
                            className={`text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded shrink-0 ${
                              item.category === 'alcohol'
                                ? 'bg-amber-100 text-amber-900'
                                : item.category === 'dessert'
                                ? 'bg-pink-100 text-pink-900'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.quantity} ración/es • {item.assignedMemberIds.length > 0 ? `${item.assignedMemberIds.length} comensal/es` : 'Sin comensales'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-slate-900 tabular-nums font-heading block whitespace-nowrap">
                        {item.total_price.toFixed(2).replace('.', ',')} €
                      </span>
                      <p className="text-[11px] text-emerald-700 font-bold tabular-nums whitespace-nowrap">
                        {item.assignedMemberIds.length > 0 ? `${unitShare.toFixed(2).replace('.', ',')} € / c/u` : `${item.total_price.toFixed(2).replace('.', ',')} € total`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asignados:</span>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {item.assignedMemberIds.length > 0 ? (
                        item.assignedMemberIds.map((mId) => {
                          const m = sala.members.find((member) => member.id === mId);
                          const isSelf = mId === currentUserId;
                          return (
                            <span
                              key={mId}
                              className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                isSelf
                                  ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isSelf ? 'Tú' : m?.alias || m?.name || mId}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Sin comensales asignados
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: MI BALANCE ==================== */}
      {activeTab === 'balance' && (
        <div className="flex flex-col gap-3">
          <section className="fintech-card p-5 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-700 text-[18px]">person</span>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Tu cuota en este evento
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                {assignedItemsCount} platos
              </span>
            </div>

            <div>
              <div className="text-4xl font-black tracking-tight text-emerald-600 leading-none tabular-nums font-heading whitespace-nowrap">
                {personalConsumption.toFixed(2).replace('.', ',')} €
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1.5">
                Importe individual exacto calculado tras deducción de raciones y costes compartidos.
              </p>
            </div>

            <div className="flex flex-col divide-y divide-slate-100 pt-1 text-xs">
              {items
                .filter((item) => item.assignedMemberIds.includes(currentUserId))
                .map((item) => {
                  const share = item.total_price / (item.assignedMemberIds.length || 1);
                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate font-heading">
                          {item.name} (1/{item.assignedMemberIds.length})
                        </p>
                        <span className="text-[10px] text-slate-500 block">
                          {item.total_price.toFixed(2).replace('.', ',')} € entre {item.assignedMemberIds.length}
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-900 tabular-nums font-heading shrink-0 whitespace-nowrap">
                        {share.toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('settle')}
              className="h-11 w-full rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-800 transition-colors shadow-xs active:scale-98"
            >
              <span>Ir a Liquidación Bizum</span>
              <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
            </button>
          </section>
        </div>
      )}

      {/* ==================== TAB 3: LIQUIDACIÓN BIZUM ==================== */}
      {activeTab === 'settle' && (
        <div className="flex flex-col gap-3">
          {/* Regla 1 + Min-Cash-Flow Banner */}
          <div className="bg-emerald-950 text-white rounded-2xl p-4 flex items-start gap-3 shadow-md relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-emerald-800/80 flex items-center justify-center shrink-0 text-emerald-300">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-[11px] font-black text-emerald-300 uppercase tracking-wider">
                  Regla 1: Pagador Sugerido
                </h4>
                <span className="text-[9px] font-bold bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded">
                  Min-Cash-Flow
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed mt-0.5">
                <strong>Mateo</strong> paga la cuenta general (184,50 €) al restaurante amortizando su balance negativo (-24,50 €).
              </p>
              <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">
                De 15 pagos cruzados reducidos a 3 transferencias directas.
              </div>
            </div>
          </div>

          {/* Lista de Bizums Directos Optimizados */}
          <div className="flex flex-col gap-2.5">
            {transactions.map((tx) => {
              const fromMember = sala.members.find((m) => m.id === tx.fromMemberId);
              const toMember = sala.members.find((m) => m.id === tx.toMemberId);
              const isToCarlos = tx.toMemberId === currentUserId;
              const isFromCarlos = tx.fromMemberId === currentUserId;

              return (
                <article
                  key={tx.id}
                  className="fintech-card p-3.5 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 font-black flex items-center justify-center text-xs shrink-0 shadow-2xs">
                        {fromMember?.name.substring(0, 2).toUpperCase() || 'MA'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 truncate font-heading">
                            {isToCarlos
                              ? `${fromMember?.name} te envía`
                              : isFromCarlos
                              ? `Tú envías a ${toMember?.name}`
                              : `${fromMember?.name} envía a ${toMember?.name}`}
                          </p>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                              tx.status === 'consolidado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tx.status === 'consolidado' ? 'Confirmado' : 'Pendiente'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          Bizum directo • {fromMember?.phone || '612 345 678'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-emerald-700 tabular-nums font-heading block whitespace-nowrap">
                        {tx.amount.toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => copyBizum(fromMember?.phone || '612 345 678')}
                      className="h-9 flex-1 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs active:scale-98"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {copiedPhone === (fromMember?.phone || '612 345 678') ? 'check' : 'content_copy'}
                      </span>
                      <span className="whitespace-nowrap">
                        {copiedPhone === (fromMember?.phone || '612 345 678') ? '¡Copiado!' : 'Copiar Bizum'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => shareWhatsApp(fromMember?.name || 'Amigo', tx.amount.toFixed(2))}
                      className="h-9 px-3 rounded-xl bg-[#25D366]/15 text-[#075E54] hover:bg-[#25D366]/25 text-xs font-bold flex items-center justify-center gap-1 transition-colors active:scale-98 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[15px]">send</span>
                      <span>WhatsApp</span>
                    </button>

                    {isToCarlos && tx.status !== 'consolidado' && (
                      <button
                        type="button"
                        onClick={() => handleConfirmPayment(tx.id)}
                        className="h-9 px-3 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold flex items-center justify-center transition-colors shadow-xs active:scale-98 shrink-0"
                        title="Confirmar cobro"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            {/* General WhatsApp Table Share */}
            <button
              type="button"
              onClick={shareEntireTable}
              className="h-11 mt-1 w-full px-4 rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-sm hover:bg-emerald-800 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span className="whitespace-nowrap">Compartir resumen en grupo de WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <QrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        roomName={sala.name}
        tableName={`${evento.venue} (${evento.table || 'Mesa 14'})`}
      />
      <MonetizationModal
        isOpen={showMonetizationModal}
        onClose={() => setShowMonetizationModal(false)}
        roomName={sala.name}
      />
      <AddPlatoModal
        isOpen={showAddPlatoModal}
        onClose={() => setShowAddPlatoModal(false)}
        salaId={sala.id}
        eventoId={evento.id}
        members={sala.members}
        currentUserId={currentUserId}
        onDishAdded={(newItem) => {
          setItems((prev) => [...prev, newItem]);
        }}
        onMultipleDishesAdded={(newItems) => {
          setItems((prev) => [...prev, ...newItems]);
        }}
      />
    </div>
  );
}
