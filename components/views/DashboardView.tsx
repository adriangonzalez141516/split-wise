'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserGlobalWallet, Sala } from '@/lib/types';
import QrModal from '@/components/modals/QrModal';
import MonetizationModal from '@/components/modals/MonetizationModal';
import { crearSalaAction } from '@/actions/salas.actions';

interface DashboardViewProps {
  wallet: UserGlobalWallet;
  salas: Sala[];
}

export default function DashboardView({ wallet, salas }: DashboardViewProps) {
  const [activeFilter, setActiveFilter] = useState<'todas' | 'botes' | 'pases'>('todas');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showMonetizationModal, setShowMonetizationModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSalaName, setNewSalaName] = useState('');
  const [newSalaDesc, setNewSalaDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredSalas = salas.filter((sala) => {
    if (activeFilter === 'botes') return sala.boteComun > 0;
    if (activeFilter === 'pases') return sala.pass.status === 'activo';
    return true;
  });

  const handleCreateSala = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalaName.trim()) return;
    setIsCreating(true);
    try {
      await crearSalaAction(newSalaName, newSalaDesc || 'Grupo de gastos');
      setNewSalaName('');
      setNewSalaDesc('');
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-32 pt-2 flex flex-col gap-4.5">
      {/* Top Header with Glassmorphic Blur */}
      <header className="sticky top-0 z-30 fintech-header py-3 -mx-4 px-4 border-b border-slate-200/70 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl ring-2 ring-emerald-500/20 overflow-hidden bg-slate-100 flex items-center justify-center shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={wallet.avatarUrl}
              alt="Avatar de usuario"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
              Hola, {wallet.userName}
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-heading mt-0.5">
              Salas &amp; Grupos
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMonetizationModal(true)}
            aria-label="Pases de Sala"
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white border border-slate-200/80 text-emerald-700 hover:bg-emerald-50/60 active:scale-95 transition-all shadow-xs"
            title="Pase Súper-Anfitrión"
          >
            <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
          </button>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            aria-label="Escanear QR o unirse a sala"
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
            title="Unirse vía QR"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
          </button>
        </div>
      </header>

      {/* 1. Hero Consolidado / Global Net Balance Card (Informativo - No compensación) */}
      <section className="fintech-card p-6 relative overflow-hidden flex flex-col gap-4">
        {/* Subtle background ambient tint */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            BALANCE GLOBAL NETO
          </span>
          <span className="fintech-pill px-3 py-1 bg-emerald-50 text-emerald-800 text-xs border border-emerald-200/70">
            <span className="material-symbols-outlined text-[15px] font-bold">trending_up</span>
            A tu favor
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-600 tracking-tight tabular-nums font-heading">
              +{wallet.netBalanceTotal.toFixed(2).replace('.', ',')} €
            </span>
            <span className="text-xs text-slate-500 font-semibold">acumulado</span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Principio de No Compensación entre salas independientes
          </p>
        </div>

        {/* Floating Metrics Tiles (Te deben / Debes) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-emerald-50/60 rounded-2xl p-3.5 border border-emerald-200/60 flex flex-col">
            <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">arrow_downward</span>
              <span>Te deben</span>
            </div>
            <span className="text-xl font-black text-emerald-700 tabular-nums font-heading mt-1">
              {wallet.totalPorCobrar.toFixed(2).replace('.', ',')} €
            </span>
          </div>

          <div className="bg-amber-50/60 rounded-2xl p-3.5 border border-amber-200/60 flex flex-col">
            <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">arrow_upward</span>
              <span>Debes</span>
            </div>
            <span className="text-xl font-black text-amber-700 tabular-nums font-heading mt-1">
              {wallet.totalPorPagar.toFixed(2).replace('.', ',')} €
            </span>
          </div>
        </div>

        {/* Action Buttons Inside Hero */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Nueva Sala</span>
          </button>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-700">group_add</span>
            <span>Unirme</span>
          </button>
        </div>
      </section>

      {/* Quick Filters */}
      <section className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => setActiveFilter('todas')}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs transition-all ${
            activeFilter === 'todas'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 font-medium'
          }`}
        >
          Todas las salas
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('botes')}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs transition-all flex items-center gap-1.5 ${
            activeFilter === 'botes'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">savings</span>
          <span>Botes comunes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('pases')}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs transition-all flex items-center gap-1.5 ${
            activeFilter === 'pases'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
          <span>Pases Anfitrión</span>
        </button>
      </section>

      {/* 2. Salas / Grupos List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold text-slate-900 font-heading uppercase tracking-wider">
            Tus Salas Activas
          </h2>
          <span className="text-xs text-slate-500 font-medium">{filteredSalas.length} en total</span>
        </div>

        {filteredSalas.map((sala) => {
          const liveEvent = sala.eventos.find((e) => e.status === 'en_curso');
          const isFeatured = sala.id === 'cenas-viernes';

          return (
            <article
              key={sala.id}
              className={`fintech-card p-5 transition-all flex flex-col gap-3.5 ${
                isFeatured ? 'fintech-card-featured' : ''
              }`}
            >
              {/* Top Live Badge Indicator if there's an ongoing event */}
              {liveEvent && (
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/sala/${sala.id}/evento/${liveEvent.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    <span className="text-[11px] font-extrabold tracking-tight">
                      En vivo: {liveEvent.venue} ({liveEvent.table})
                    </span>
                  </Link>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Ahora</span>
                </div>
              )}

              {/* Room Header & Net Balance */}
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">
                        {sala.icon || 'groups'}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-heading truncate">
                      <Link href={`/sala/${sala.id}`} className="hover:text-emerald-700 transition-colors">
                        {sala.name}
                      </Link>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1 truncate">{sala.description}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
                    Tu balance
                  </span>
                  {sala.id === 'cenas-viernes' && (
                    <span className="text-lg font-black text-emerald-600 tabular-nums font-heading mt-0.5 block">
                      +24,80 €
                    </span>
                  )}
                  {sala.id === 'piso-calle-mayor' && (
                    <span className="text-lg font-black text-amber-600 tabular-nums font-heading mt-0.5 block">
                      -12,50 €
                    </span>
                  )}
                  {sala.id === 'viaje-asturias-2024' && (
                    <span className="text-base font-bold text-slate-500 tabular-nums font-heading mt-0.5 block">
                      0,00 €
                    </span>
                  )}
                </div>
              </div>

              {/* Metric Details Row (Bote + Pase IA) */}
              <div className="bg-slate-50/90 rounded-2xl p-3 flex items-center justify-between border border-slate-200/60 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100/70 flex items-center justify-center text-emerald-800">
                    <span className="material-symbols-outlined text-sm">savings</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
                      Bote común
                    </span>
                    <span className="font-extrabold text-slate-900 tabular-nums mt-0.5 block">
                      {sala.boteComun.toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                </div>

                <div className="h-5 w-px bg-slate-200"></div>

                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">auto_awesome</span>
                  <span className="text-slate-600 text-[11px] font-medium">
                    {sala.pass.status === 'activo' ? (
                      <>
                        Pase activo <strong className="text-slate-900 font-bold">{sala.pass.eventsUsed}/20 IA</strong>
                      </>
                    ) : (
                      <span className="text-slate-400 font-semibold">Sin pase IA</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Members Facepile & CTA Row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center">
                  <div className="flex -space-x-2 overflow-hidden items-center">
                    {sala.members.slice(0, 5).map((m, idx) => {
                      if (m.avatarUrl) {
                        return (
                          <div
                            key={m.id}
                            className="inline-block h-7 w-7 rounded-full ring-2 ring-white overflow-hidden shadow-2xs"
                            title={m.name}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                          </div>
                        );
                      }
                      return (
                        <div
                          key={m.id}
                          className={`inline-block h-7 w-7 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold shadow-2xs ${
                            m.isVirtual
                              ? 'border border-dashed border-amber-300 bg-amber-50 text-amber-800'
                              : idx % 2 === 0
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                          title={m.isVirtual ? `${m.name} (Invitada virtual)` : m.name}
                        >
                          {m.isVirtual ? 'M*' : m.name.charAt(0)}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs text-slate-500 font-semibold ml-2.5">
                    {sala.members.length} miembros
                  </span>
                </div>

                {liveEvent ? (
                  <Link
                    href={`/sala/${sala.id}/evento/${liveEvent.id}`}
                    className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold hover:underline active:scale-95 transition-transform"
                  >
                    <span>Entrar a mesa</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                ) : (
                  <Link
                    href={`/sala/${sala.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    Ver sala
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* 3. Utility Link */}
      <section className="pt-1">
        <Link
          href="/actividad"
          className="fintech-card p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 font-heading">Desglose de tickets pasados</h4>
              <p className="text-[11px] text-slate-500 font-medium">Consulta historiales y comprobantes con IA</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 transition-colors text-[18px]">
            chevron_right
          </span>
        </Link>
      </section>

      {/* Modals */}
      <QrModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
      <MonetizationModal
        isOpen={showMonetizationModal}
        onClose={() => setShowMonetizationModal(false)}
      />

      {/* Modal Nueva Sala */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900 font-heading">Crear Nueva Sala</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Contenedor permanente para gastos de ocio, piso compartido o viajes.
            </p>
            <form onSubmit={handleCreateSala} className="flex flex-col gap-3 mt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de la sala</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Cenas de los Viernes, Piso Compartido"
                  value={newSalaName}
                  onChange={(e) => setNewSalaName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600 bg-slate-50 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Descripción</label>
                <input
                  type="text"
                  placeholder="ej. Gastos de comida y compras grupales"
                  value={newSalaDesc}
                  onChange={(e) => setNewSalaDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600 bg-slate-50 focus:bg-white transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  {isCreating ? 'Creando...' : 'Crear Sala'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
