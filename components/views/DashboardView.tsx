'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserGlobalWallet, Sala } from '@/lib/types';
import { calculateRoomBalance, CURRENT_USER_ID } from '@/lib/store';
import QrModal from '@/components/modals/QrModal';
import MonetizationModal from '@/components/modals/MonetizationModal';
import { crearSalaAction } from '@/actions/salas.actions';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface DashboardViewProps {
  wallet: UserGlobalWallet;
  salas: Sala[];
  currentUserId: string;
}

export default function DashboardView({ wallet, salas, currentUserId }: DashboardViewProps) {
  const router = useRouter();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showMonetizationModal, setShowMonetizationModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSalaName, setNewSalaName] = useState('');
  const [newSalaDesc, setNewSalaDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSala = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalaName.trim()) return;
    setIsCreating(true);
    try {
      await crearSalaAction(newSalaName, newSalaDesc || 'Grupo de gastos');
      setNewSalaName('');
      setNewSalaDesc('');
      setShowCreateModal(false);
      router.refresh();
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-none">
              Hola, {wallet.userName}
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight font-heading mt-0.5">
              Tus Grupos
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setShowMonetizationModal(true)}
            aria-label="Pases de Grupo"
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-xs"
            title="Pase Súper-Anfitrión"
          >
            <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
          </button>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            aria-label="Escanear QR o unirse a grupo"
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-xs"
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
          {wallet.netBalanceTotal > 0 ? (
            <span className="fintech-pill px-3 py-1 bg-emerald-50 text-emerald-800 text-xs border border-emerald-200/70">
              <span className="material-symbols-outlined text-[15px] font-bold">trending_up</span>
              A tu favor
            </span>
          ) : wallet.netBalanceTotal < 0 ? (
            <span className="fintech-pill px-3 py-1 bg-amber-50 text-amber-800 text-xs border border-amber-200/70">
              <span className="material-symbols-outlined text-[15px] font-bold">trending_down</span>
              Debes pagar
            </span>
          ) : (
            <span className="fintech-pill px-3 py-1 bg-slate-100 text-slate-700 text-xs border border-slate-200">
              <span className="material-symbols-outlined text-[15px] font-bold">check_circle</span>
              Al día
            </span>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black tracking-tight tabular-nums font-heading ${
              wallet.netBalanceTotal > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : wallet.netBalanceTotal < 0
                ? 'text-amber-700 dark:text-amber-500'
                : 'text-slate-800 dark:text-slate-100'
            }`}>
              {wallet.netBalanceTotal > 0
                ? `+${wallet.netBalanceTotal.toFixed(2).replace('.', ',')} €`
                : `${wallet.netBalanceTotal.toFixed(2).replace('.', ',')} €`}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">acumulado</span>
          </div>
        </div>

        {/* Floating Metrics Tiles (Te deben / Debes) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-emerald-50/60 dark:bg-emerald-900/20 rounded-2xl p-3.5 border border-emerald-200/60 dark:border-emerald-800/40 flex flex-col">
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">arrow_downward</span>
              <span>Te deben</span>
            </div>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums font-heading mt-1">
              {wallet.totalPorCobrar.toFixed(2).replace('.', ',')} €
            </span>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-900/20 rounded-2xl p-3.5 border border-amber-200/60 dark:border-amber-800/40 flex flex-col">
            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">arrow_upward</span>
              <span>Debes</span>
            </div>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300 tabular-nums font-heading mt-1">
              {wallet.totalPorPagar.toFixed(2).replace('.', ',')} €
            </span>
          </div>
        </div>

        {/* Action Buttons Inside Hero */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Nuevo Grupo</span>
          </button>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-700 dark:text-emerald-400">group_add</span>
            <span>Unirme</span>
          </button>
        </div>
      </section>

      {/* 2. Salas / Grupos List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white font-heading uppercase tracking-wider">
            Tus Grupos Activos
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{salas.length} en total</span>
        </div>

        {salas.length === 0 && (
          <div className="fintech-card p-8 flex flex-col items-center justify-center text-center gap-4 py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2 ring-4 ring-slate-50 dark:ring-slate-800/50">
              <span className="material-symbols-outlined text-3xl">meeting_room</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-heading">Aún no tienes grupos</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-[250px] mx-auto leading-relaxed">
                Crea un nuevo grupo para empezar a compartir gastos, o únete a uno existente mediante código QR.
              </p>
            </div>
            <div className="flex flex-col w-full gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Crear mi primer Grupo
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] text-emerald-700 dark:text-emerald-400">qr_code_scanner</span>
                Escanear código QR
              </button>
            </div>
          </div>
        )}

        {salas.map((sala, idx) => {
          const isFeatured = sala.id === 'cenas-viernes';
          const myMember =
            sala.members.find(
              (m) =>
                m.id === currentUserId ||
                m.registeredUserId === currentUserId ||
                m.id === 'm1' ||
                m.name.includes('(Tú)')
            ) || sala.members[0];
          const targetId = myMember ? myMember.id : currentUserId;
          const roomCalc = calculateRoomBalance(sala, targetId);
          const net = roomCalc.netBalance;

          return (
            <article
              key={sala.id}
              className={`fintech-card p-5 transition-all flex flex-col gap-3.5 ${
                isFeatured ? 'fintech-card-featured' : ''
              }`}
            >
              {/* Room Header & Net Balance */}
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">
                        {sala.icon || 'groups'}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight font-heading truncate">
                      <Link prefetch={idx === 0 ? true : undefined} href={`/sala/${sala.id}`} className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                        {sala.name}
                      </Link>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">{sala.description}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-none">
                    Tu balance
                  </span>
                  <span className={`text-lg font-black tabular-nums font-heading mt-0.5 block ${
                    net > 0 ? 'text-emerald-600 dark:text-emerald-400' : net < 0 ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {net > 0 ? `+${net.toFixed(2).replace('.', ',')} €` : `${net.toFixed(2).replace('.', ',')} €`}
                  </span>
                </div>
              </div>

              {/* Members Facepile & CTA Row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center">
                  <div className="flex -space-x-2 overflow-hidden items-center">
                    {sala.members.slice(0, 5).map((m, idx) => {
                      if (m.avatarUrl) {
                        return (
                          <div
                            key={m.id}
                            className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-800 overflow-hidden shadow-2xs"
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
                          className={`inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-[10px] font-bold shadow-2xs ${
                            m.isVirtual
                              ? 'border border-dashed border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                              : idx % 2 === 0
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                          }`}
                          title={m.isVirtual ? `${m.name} (Invitada virtual)` : m.name}
                        >
                          {m.isVirtual ? 'M*' : m.name.charAt(0)}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold ml-2.5">
                    {sala.members.length} miembros
                  </span>
                </div>

                <Link
                  href={`/sala/${sala.id}`}
                  prefetch={idx === 0 ? true : undefined}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs flex items-center gap-1"
                >
                  <span>Ver grupo</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </article>
          );
        })}
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">Crear Nuevo Grupo</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Contenedor permanente para gastos de ocio, piso compartido o viajes.
            </p>
            <form onSubmit={handleCreateSala} className="flex flex-col gap-3 mt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nombre del grupo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Cenas de los Viernes, Piso Compartido"
                  value={newSalaName}
                  onChange={(e) => setNewSalaName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-emerald-600 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Descripción</label>
                <input
                  type="text"
                  placeholder="ej. Gastos de comida y compras grupales"
                  value={newSalaDesc}
                  onChange={(e) => setNewSalaDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-emerald-600 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors shadow-xs"
                >
                  {isCreating ? 'Creando...' : 'Crear Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
