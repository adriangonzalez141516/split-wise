'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sala, Member } from '@/lib/types';
import {
  calculateCascadeRequest,
  calculateCascadePayment,
  calculateMinCashFlow,
  MemberBalance,
} from '@/lib/min-cash-flow';

export interface MemberBalanceInfo {
  memberId: string;
  name: string;
  phone?: string;
  isVirtual: boolean;
  netBalance: number;
}

interface SettlementActionsModalProps {
  isOpen: boolean;
  initialTab?: 'request' | 'pay' | 'room_close';
  onClose: () => void;
  sala: Sala;
  allBalances: MemberBalanceInfo[];
  currentUserId: string;
}

export default function SettlementActionsModal({
  isOpen,
  initialTab = 'request',
  onClose,
  sala,
  allBalances,
  currentUserId,
}: SettlementActionsModalProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'pay' | 'room_close'>(initialTab);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentUserId);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [consolidatedList, setConsolidatedList] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const selectedMember = allBalances.find((b) => b.memberId === selectedMemberId) || allBalances[0];

  // 1. Calculate Cascade Request (Rule 2)
  const cascadeRequestResult = calculateCascadeRequest(selectedMemberId, allBalances);

  // 2. Calculate Cascade Payment (Rule 3)
  const cascadePaymentResult = calculateCascadePayment(selectedMemberId, allBalances);

  // 3. Calculate Min-Cash-Flow Room Liquidation (Rule 4)
  const memberBalances: MemberBalance[] = allBalances.map((b) => ({
    memberId: b.memberId,
    netBalance: b.netBalance,
  }));
  const minCashFlowTransactions = calculateMinCashFlow(memberBalances);

  // WhatsApp helper
  const openWhatsApp = (phone: string | undefined, message: string) => {
    const encoded = encodeURIComponent(message);
    const cleanPhone = phone ? phone.replace(/\s+/g, '') : '';
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Copy helper
  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Consolidate full room
  const handleConsolidateRoom = () => {
    const nextState: Record<string, boolean> = {};
    minCashFlowTransactions.forEach((tx) => {
      nextState[tx.id] = true;
    });
    setConsolidatedList(nextState);

    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settlement-modal-title"
      className="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">currency_exchange</span>
            </div>
            <div>
              <h2 id="settlement-modal-title" className="text-sm font-black text-slate-900 font-heading">
                Gestión de Saldos y Puesta al Día
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

        {/* 3 Main Settlement Options Segmented Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200/80">
          <div className="grid grid-cols-3 gap-1 bg-slate-200/60 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('request')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${
                activeTab === 'request'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">call_received</span>
                <span className="font-extrabold text-[11px] whitespace-nowrap">1. Cobrar</span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">Petición cascada</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pay')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${
                activeTab === 'pay'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">payments</span>
                <span className="font-extrabold text-[11px] whitespace-nowrap">2. Pagar</span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">Ponerme al día</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('room_close')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${
                activeTab === 'room_close'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">account_tree</span>
                <span className="font-extrabold text-[11px] whitespace-nowrap">3. Min-Cash</span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">Cierre de Grupo</span>
            </button>
          </div>

          {/* Member Selector (Allows inspecting as Carlos or any other room member) */}
          {activeTab !== 'room_close' && (
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap pl-1">
                Miembro:
              </span>
              {allBalances.map((mb) => {
                const isSelected = mb.memberId === selectedMemberId;
                const isPositive = mb.netBalance > 0.005;
                const isNegative = mb.netBalance < -0.005;

                return (
                  <button
                    key={mb.memberId}
                    type="button"
                    onClick={() => setSelectedMemberId(mb.memberId)}
                    className={`h-7 px-2.5 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap transition-all shrink-0 ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow-xs ring-2 ring-emerald-600/30'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{mb.name}</span>
                    <span
                      className={`text-[10px] tabular-nums font-extrabold ${
                        isSelected
                          ? 'text-emerald-200'
                          : isPositive
                          ? 'text-emerald-700'
                          : isNegative
                          ? 'text-amber-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {mb.netBalance > 0 ? `+${mb.netBalance.toFixed(2)}€` : `${mb.netBalance.toFixed(2)}€`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 overflow-y-auto max-h-[58vh] flex flex-col gap-3">
          {/* ========================================================
              OPCIÓN 1: SOLICITAR QUE SE PONGAN AL DÍA CONMIGO (Regla 2)
             ======================================================== */}
          {activeTab === 'request' && (
            <div className="flex flex-col gap-3">
              {/* Summary Card */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                      Regla 2 • Petición en Cascada
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mt-0.5">
                    Solicitud para {selectedMember.name}
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                    Reclama lo que se le debe. El sistema le pide primero al <strong>que más debe</strong> en el grupo; si no cubre el total, absorbe el 100% y pasa en cascada al 2º y 3º.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Te deben</span>
                  <span className="text-lg font-black text-emerald-700 tabular-nums font-heading whitespace-nowrap">
                    {selectedMember.netBalance > 0
                      ? `+${selectedMember.netBalance.toFixed(2).replace('.', ',')} €`
                      : '0,00 €'}
                  </span>
                </div>
              </div>

              {selectedMember.netBalance <= 0.005 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-3xl">info</span>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedMember.name} no tiene saldo a favor ({selectedMember.netBalance.toFixed(2).replace('.', ',')} €).
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    Solo los miembros con saldo positivo pueden solicitar cobro. Prueba seleccionando arriba a un acreedor como <strong>Mateo</strong> (+139,35 €) para ver su cascada de cobro.
                  </p>
                </div>
              ) : cascadeRequestResult.requests.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
                  No hay deudores pendientes en este grupo.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1">
                    <span>DEUDORES ASIGNADOS EN CASCADA ({cascadeRequestResult.requests.length})</span>
                    <span>IMPORTE A RECLAMAR</span>
                  </div>

                  {cascadeRequestResult.requests.map((req, idx) => {
                    const message = `Hola ${req.name}, en el grupo "${sala.name}" según el reparto en cascada te corresponde ponerte al día con ${req.amount.toFixed(2)} € por Bizum a ${selectedMember.name}${selectedMember.phone ? ` (${selectedMember.phone})` : ''}. ¡Gracias!`;

                    return (
                      <div
                        key={req.debtorId}
                        className="fintech-card p-3 flex flex-col gap-2.5 border-l-4 border-l-emerald-600"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 font-black text-slate-800 flex items-center justify-center text-xs shrink-0">
                              #{idx + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 truncate font-heading">
                                  {req.name}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold whitespace-nowrap">
                                  {idx === 0 ? 'Mayor deudor' : `${idx + 1}º deudor`}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                {req.phone || 'Comensal del grupo'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-emerald-700 tabular-nums font-heading block whitespace-nowrap">
                              {req.amount.toFixed(2).replace('.', ',')} €
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">Cuota asignada</span>
                          </div>
                        </div>

                        {/* Action buttons for this debtor */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => openWhatsApp(req.phone, message)}
                            className="py-1.5 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition-all active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[15px]">chat</span>
                            <span className="whitespace-nowrap">Pedir por WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => copyText(message, idx)}
                            className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {copiedIndex === idx ? 'check' : 'content_copy'}
                            </span>
                            <span className="whitespace-nowrap">
                              {copiedIndex === idx ? '¡Copiado!' : 'Copiar Petición'}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              OPCIÓN 2: PONERME AL DÍA / PAGAR MI DEUDA (Regla 3)
             ======================================================== */}
          {activeTab === 'pay' && (
            <div className="flex flex-col gap-3">
              {/* Summary Card */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                      Regla 3 • Puesta al Día en Cascada
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mt-0.5">
                    Liquidación para {selectedMember.name}
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                    Pagas al <strong>que más dinero se le deba</strong> en el grupo. Si tienes que pagar más de lo que se le debe, el excedente va en cascada al 2º y 3º acreedor.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Debes</span>
                  <span className="text-lg font-black text-amber-700 tabular-nums font-heading whitespace-nowrap">
                    {selectedMember.netBalance < 0
                      ? `${Math.abs(selectedMember.netBalance).toFixed(2).replace('.', ',')} €`
                      : '0,00 €'}
                  </span>
                </div>
              </div>

              {selectedMember.netBalance >= -0.005 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl">check_circle</span>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedMember.name} está al día en este grupo ({selectedMember.netBalance.toFixed(2).replace('.', ',')} €).
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    No tiene deuda pendiente. Selecciona arriba a un deudor como <strong>Carlos</strong> (-13,48 €) o <strong>Laura</strong> (-45,15 €) para ver a quién deben transferir por Bizum.
                  </p>
                </div>
              ) : cascadePaymentResult.payments.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
                  No se han encontrado acreedores con saldo a favor.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1">
                    <span>ACREEDORES EN CASCADA ({cascadePaymentResult.payments.length})</span>
                    <span>IMPORTE A PAGAR</span>
                  </div>

                  {cascadePaymentResult.payments.map((pay, idx) => {
                    const message = `Hola ${pay.name}, te acabo de transferir ${pay.amount.toFixed(2)} € por Bizum para ponerme al día en el grupo "${sala.name}". ¡Un saludo!`;

                    return (
                      <div
                        key={pay.creditorId}
                        className="fintech-card p-3.5 flex flex-col gap-2.5 border-l-4 border-l-emerald-600"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 font-black text-emerald-900 flex items-center justify-center text-xs shrink-0">
                              #{idx + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 truncate font-heading">
                                  {pay.name}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-bold whitespace-nowrap">
                                  {idx === 0 ? 'Mayor acreedor' : `${idx + 1}º acreedor`}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                Tel. Bizum: {pay.phone || '612 345 678'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-slate-900 tabular-nums font-heading block whitespace-nowrap">
                              {pay.amount.toFixed(2).replace('.', ',')} €
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">A transferir</span>
                          </div>
                        </div>

                        {/* Action buttons for this creditor */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => copyText(pay.phone || '612 345 678', 100 + idx)}
                            className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {copiedIndex === 100 + idx ? 'check' : 'phone_iphone'}
                            </span>
                            <span className="whitespace-nowrap">
                              {copiedIndex === 100 + idx ? '¡Copiado!' : 'Copiar Bizum'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openWhatsApp(pay.phone, message)}
                            className="py-1.5 px-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition-all active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[15px]">send</span>
                            <span className="whitespace-nowrap">Avisar WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              OPCIÓN 3: CIERRE DE SALA & MIN-CASH-FLOW (Regla 4)
             ======================================================== */}
          {activeTab === 'room_close' && (
            <div className="flex flex-col gap-3">
              {/* Summary Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-start gap-3 shadow-md">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      Regla 4 • Min-Cash-Flow
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-800 text-emerald-200 font-bold whitespace-nowrap">
                      Suma Cero Exacta
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white mt-0.5 font-heading">
                    Liquidación Global del Grupo
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                    Algoritmo de resolución en grafo óptimo: todas las deudas cruzadas entre los {sala.members.length} miembros se cancelan con solo {minCashFlowTransactions.length} transferencias directas.
                  </p>
                </div>
              </div>

              {/* Transactions List */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1">
                  <span>TRANSFERENCIAS ÓPTIMAS ({minCashFlowTransactions.length})</span>
                  <span>ESTADO</span>
                </div>

                {minCashFlowTransactions.map((tx) => {
                  const fromMember = allBalances.find((b) => b.memberId === tx.fromMemberId);
                  const toMember = allBalances.find((b) => b.memberId === tx.toMemberId);
                  const isDone = consolidatedList[tx.id];

                  return (
                    <div
                      key={tx.id}
                      className={`fintech-card p-3 flex items-center justify-between gap-2.5 transition-all ${
                        isDone ? 'bg-emerald-50/50 border-emerald-300' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            isDone ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isDone ? 'check' : 'east'}
                          </span>
                        </div>
                        <div className="min-w-0 text-xs">
                          <p className="font-bold text-slate-900 truncate font-heading">
                            <strong>{fromMember?.name || 'Deudor'}</strong> paga a <strong>{toMember?.name || 'Acreedor'}</strong>
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Por Bizum directo • Céntimos auditados
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-900 tabular-nums font-heading block whitespace-nowrap">
                          {tx.amount.toFixed(2).replace('.', ',')} €
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider ${
                            isDone ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {isDone ? 'Saldado' : 'Propuesta'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Consolidate Button */}
              <button
                type="button"
                onClick={handleConsolidateRoom}
                className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 mt-1"
              >
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                <span>Consolidar Liquidación Completa</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[10px] text-slate-400 font-medium">
            LaRonda Core Financial Engine • RGPD & Suma Cero
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-bold text-xs text-slate-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
