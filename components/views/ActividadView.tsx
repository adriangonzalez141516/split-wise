'use client';

import React from 'react';
import Link from 'next/link';

export default function ActividadView() {
  return (
    <div className="w-full max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">
      <header className="py-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
          Historial & Actividad
        </h1>
        <Link href="/" className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
          Volver
        </Link>
      </header>

      <section className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <span className="material-symbols-outlined text-[32px]">construction</span>
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white font-heading mb-1">
            Próximamente
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Estamos preparando el feed global de actividad. Aquí podrás ver todos los movimientos, tickets y pagos de tus salas en tiempo real.
          </p>
        </div>
      </section>
    </div>
  );
}
