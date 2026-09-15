'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sala, RoomBalanceCalculation } from '@/lib/types';
import QrModal from '@/components/modals/QrModal';
import MonetizationModal from '@/components/modals/MonetizationModal';
import ScanTicketModal from '@/components/modals/ScanTicketModal';
import SettlementActionsModal, { MemberBalanceInfo } from '@/components/modals/SettlementActionsModal';
import CreateEventoModal from '@/components/modals/CreateEventoModal';
import { anadirMiembroVirtualAction } from '@/actions/salas.actions';

interface SalaViewProps {
  sala: Sala;
  balanceCalculation: RoomBalanceCalculation;
  allBalances?: MemberBalanceInfo[];
}

export default function SalaView({ sala, balanceCalculation, allBalances }: SalaViewProps) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [showMonetizationModal, setShowMonetizationModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showCreateEventoModal, setShowCreateEventoModal] = useState(false);
  const [showAddVirtualModal, setShowAddVirtualModal] = useState(false);
  const [settlementModalTab, setSettlementModalTab] = useState<'request' | 'pay' | 'room_close' | null>(null);
  const [virtualName, setVirtualName] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Effective member balances list
  const effectiveBalances: MemberBalanceInfo[] =
    allBalances && allBalances.length > 0
      ? allBalances
      : sala.members.map((m) => ({
          memberId: m.id,
          name: m.name,
          phone: m.phone,
          isVirtual: m.isVirtual,
          netBalance: m.id === 'user-carlos' ? balanceCalculation.netBalance : 0,
        }));

  const handleAddVirtual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!virtualName.trim()) return;
    await anadirMiembroVirtualAction(sala.id, virtualName.trim());
    setVirtualName('');
    setShowAddVirtualModal(false);
  };

  const copyClaimLink = (token?: string) => {
    if (!token) return;
    const url = `${window.location.origin}/registro?claim_token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-32 pt-2 flex flex-col gap-4">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 fintech-header py-2.5 -mx-4 px-4 border-b border-slate-200/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs shrink-0 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate leading-none">
              <span>Sala permanente</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">{sala.members.length} miembros</span>
            </div>
            <h1 className="text-base font-black text-slate-900 tracking-tight font-heading truncate leading-none mt-1">
              {sala.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowMonetizationModal(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all shadow-2xs"
            title="Pase de Sala"
          >
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
          </button>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
            title="Invitar con QR"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
          </button>
        </div>
      </header>

      {/* Operative Room Wallet Card (Monedero de Sala Operativo Bs) */}
      <section className="fintech-card p-5 flex flex-col gap-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            MONEDERO DE SALA (OPERATIVO)
          </span>
          <span className="fintech-pill px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] border border-emerald-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Sala Activa
          </span>
        </div>

        <div>
          <div className={`text-4xl font-black tracking-tight tabular-nums font-heading ${
            balanceCalculation.netBalance >= 0 ? 'text-emerald-600' : 'text-amber-700'
          }`}>
            {balanceCalculation.netBalance > 0
              ? `+${balanceCalculation.netBalance.toFixed(2).replace('.', ',')} €`
              : `${balanceCalculation.netBalance.toFixed(2).replace('.', ',')} €`}
          </div>
        </div>

        {/* Floating Modern Metric Tiles */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200/60 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-emerald-700 text-sm mb-0.5">savings</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bote común</span>
            <span className="text-xs font-black text-slate-900 tabular-nums font-heading mt-0.5 whitespace-nowrap">
              {sala.boteComun.toFixed(2).replace('.', ',')} €
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200/60 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-amber-700 text-sm mb-0.5">shield</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Límite deuda</span>
            <span className="text-xs font-black text-slate-900 tabular-nums font-heading mt-0.5 whitespace-nowrap">
              {sala.debtThreshold.toFixed(2).replace('.', ',')} €
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200/60 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-emerald-700 text-sm mb-0.5">auto_awesome</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pase IA</span>
            <span className="text-xs font-black text-emerald-700 tabular-nums font-heading mt-0.5 whitespace-nowrap">
              {sala.pass.eventsUsed}/20
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowCreateEventoModal(true)}
            className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98"
          >
            <span className="material-symbols-outlined text-[17px]">add_circle</span>
            <span className="whitespace-nowrap">Nuevo Evento</span>
          </button>

          <button
            type="button"
            onClick={() => setShowScanModal(true)}
            className="py-2.5 px-3 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-98"
          >
            <span className="material-symbols-outlined text-[17px]">receipt_long</span>
            <span className="whitespace-nowrap">Escanear Ticket IA</span>
          </button>
        </div>
      </section>

      {/* 3 Opciones de Liquidación y Puesta al Día */}
      <section className="fintech-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-700 text-[18px]">currency_exchange</span>
            <h3 className="text-xs font-black text-slate-900 font-heading uppercase tracking-wider">
              Liquidación y Puesta al Día
            </h3>
          </div>
          <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
            3 Opciones
          </span>
        </div>

        <p className="text-[11px] text-slate-500 -mt-1 leading-normal">
          Acciones de compensación en cascada y liquidación global de sala con saldo neto suma cero.
        </p>

        <div className="flex flex-col gap-2 pt-0.5">
          {/* Opción 1: Solicitar que se pongan al día conmigo */}
          <button
            type="button"
            onClick={() => setSettlementModalTab('request')}
            className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 transition-all flex items-center justify-between gap-3 group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 text-emerald-900 flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                <span className="material-symbols-outlined text-[18px]">call_received</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900 font-heading">
                    1. Reclamar Cobro en Cascada
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900">
                    Regla 2
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Reclama al que más debe (pasa al 2º y 3º si no cubre el total).
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-700 text-[18px] shrink-0 transition-colors">
              chevron_right
            </span>
          </button>

          {/* Opción 2: Ponerme al día de cobro/pago */}
          <button
            type="button"
            onClick={() => setSettlementModalTab('pay')}
            className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-300 transition-all flex items-center justify-between gap-3 group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-100 group-hover:bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900 font-heading">
                    2. Ponerme al Día (Pagar)
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                    Regla 3
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Te indica cuánto pagar y a quién (al mayor acreedor primero).
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-amber-700 text-[18px] shrink-0 transition-colors">
              chevron_right
            </span>
          </button>

          {/* Opción 3: Cierre de sala Min-Cash-Flow */}
          <button
            type="button"
            onClick={() => setSettlementModalTab('room_close')}
            className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 transition-all flex items-center justify-between gap-3 group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-200 group-hover:bg-slate-300 text-slate-800 flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900 font-heading">
                    3. Cierre de Sala (Min-Cash-Flow)
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                    Regla 4
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Liquidación general optimizada para saldar toda la sala a 0,00 €.
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-800 text-[18px] shrink-0 transition-colors">
              chevron_right
            </span>
          </button>
        </div>
      </section>

      {/* Members Section (Registrados vs Virtuales) */}
      <section className="fintech-card p-4.5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-700 text-[18px]">group</span>
            <h3 className="text-xs font-extrabold text-slate-900 font-heading uppercase tracking-wider">
              Miembros de la Sala
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddVirtualModal(true)}
            className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>Añadir virtual</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {sala.members.map((member) => (
            <div key={member.id} className="py-2.5 flex items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 shadow-2xs ${
                    member.isVirtual
                      ? 'border border-dashed border-amber-300 bg-amber-50 text-amber-800'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {member.isVirtual ? 'M*' : member.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 truncate font-heading">{member.name}</span>
                    {member.isVirtual && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold uppercase tracking-wider">
                        Virtual
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                    {member.phone || (member.isVirtual ? 'Acceso Web Guest con QR' : 'Usuario Registrado')}
                  </span>
                </div>
              </div>

              {member.isVirtual && member.claimToken && (
                <button
                  type="button"
                  onClick={() => copyClaimLink(member.claimToken)}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-xs font-bold text-emerald-700 flex items-center gap-1 transition-all shadow-2xs shrink-0 active:scale-95"
                  title="Copiar enlace para reclamar cuenta"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedToken === member.claimToken ? 'check' : 'link'}
                  </span>
                  <span>{copiedToken === member.claimToken ? 'Copiado' : 'Claim'}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      <QrModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} roomName={sala.name} />
      <MonetizationModal
        isOpen={showMonetizationModal}
        onClose={() => setShowMonetizationModal(false)}
        roomName={sala.name}
        eventsUsed={sala.pass.eventsUsed}
        maxEvents={sala.pass.maxEvents}
      />
      <ScanTicketModal isOpen={showScanModal} onClose={() => setShowScanModal(false)} />
      <CreateEventoModal
        sala={sala}
        isOpen={showCreateEventoModal}
        onClose={() => setShowCreateEventoModal(false)}
        onOpenScan={() => setShowScanModal(true)}
      />
      <SettlementActionsModal
        isOpen={settlementModalTab !== null}
        initialTab={settlementModalTab || 'request'}
        onClose={() => setSettlementModalTab(null)}
        sala={sala}
        allBalances={effectiveBalances}
        currentUserId="user-carlos"
      />

      {/* Add Virtual Member Modal */}
      {showAddVirtualModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold text-slate-900 font-heading">Añadir Miembro Virtual</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Crea un perfil de invitado temporal para comensales en mesa sin necesidad de registro previo.
            </p>
            <form onSubmit={handleAddVirtual} className="flex flex-col gap-3 mt-1">
              <input
                type="text"
                required
                placeholder="Nombre o alias (ej. Lucía, Pablo)"
                value={virtualName}
                onChange={(e) => setVirtualName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600 transition-colors"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddVirtualModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  Crear Miembro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
