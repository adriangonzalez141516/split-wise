'use client';

import React from 'react';
import Link from 'next/link';
import { ActivityItem } from '@/actions/actividad.actions';

interface ActividadViewProps {
  activities?: ActivityItem[];
  currentUserId?: string;
}

export default function ActividadView({ activities = [], currentUserId }: ActividadViewProps) {
  // Función para formatear fechas relativas
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 172800) return 'Ayer';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-32 pt-2 flex flex-col gap-4">
      {/* Header */}
      <header className="sticky top-0 z-30 fintech-header py-3 -mx-4 px-4 border-b border-slate-200/70 flex justify-between items-center bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md">
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight font-heading mt-0.5">
          Actividad Global
        </h1>
        <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-2xs">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </Link>
      </header>

      {/* Feed List */}
      <section className="flex flex-col gap-3 pt-2">
        {activities.length === 0 ? (
          <div className="fintech-card p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-[32px]">notifications_paused</span>
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white font-heading">
                Aún no hay actividad
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Cuando tus amigos añadan tickets o te hagan Bizums en tus salas, aparecerán aquí.
              </p>
            </div>
            <Link href="/" className="mt-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
              Ir a mis salas
            </Link>
          </div>
        ) : (
          activities.map((act) => {
            const isEvento = act.type === 'evento';
            
            return (
              <article
                key={act.id}
                className="fintech-card p-4 transition-all flex items-start gap-3.5 group hover:border-emerald-300 dark:hover:border-emerald-700/50"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                  isEvento 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40' 
                    : act.isPositiveForMe === true
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                    : act.isPositiveForMe === false
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700'
                }`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {isEvento ? 'receipt_long' : act.isPositiveForMe === true ? 'call_received' : act.isPositiveForMe === false ? 'payments' : 'currency_exchange'}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight font-heading truncate">
                      {isEvento ? act.title : act.actorName}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 mt-0.5">
                      {formatTimeAgo(act.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {act.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                      {act.salaName}
                    </span>
                    {act.amount > 0 && (
                      <span className={`text-xs font-black tabular-nums ${
                        isEvento ? 'text-slate-700 dark:text-slate-300' : act.isPositiveForMe === true ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-500'
                      }`}>
                        {act.amount.toFixed(2).replace('.', ',')} €
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
