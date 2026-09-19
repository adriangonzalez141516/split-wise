'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isSalasActive = pathname === '/' || pathname.startsWith('/sala');
  const isActividadActive = pathname === '/actividad';
  const isPerfilActive = pathname === '/perfil';

  return (
    <div className="min-h-full flex flex-col bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-500">
      <main className="flex-1 w-full">{children}</main>

      {/* Floating Luxury Frosted Capsule Navbar */}
      <nav
        aria-label="Navegación principal"
        className="fixed bottom-4 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none"
      >
        <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_16px_40px_rgba(15,23,42,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)] rounded-full px-2 py-1.5 flex items-center justify-between gap-1 max-w-sm w-full transition-colors duration-500">
          {/* Salas */}
          <Link
            href="/"
            prefetch={true}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs transition-all active:scale-95 ${
              isSalasActive
                ? 'bg-emerald-700 dark:bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <span
              className="material-symbols-outlined text-[19px]"
              style={{ fontVariationSettings: isSalasActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              groups
            </span>
            <span>Salas</span>
          </Link>

          {/* Actividad */}
          <Link
            href="/actividad"
            prefetch={true}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs transition-all active:scale-95 ${
              isActividadActive
                ? 'bg-emerald-700 dark:bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <span
              className="material-symbols-outlined text-[19px]"
              style={{ fontVariationSettings: isActividadActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              receipt_long
            </span>
            <span>Actividad</span>
          </Link>

          {/* Perfil */}
          <Link
            href="/perfil"
            prefetch={true}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs transition-all active:scale-95 ${
              isPerfilActive
                ? 'bg-emerald-700 dark:bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <span
              className="material-symbols-outlined text-[19px]"
              style={{ fontVariationSettings: isPerfilActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              person
            </span>
            <span>Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
