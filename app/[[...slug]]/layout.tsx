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
    <div className="min-h-full flex flex-col bg-[#F8FAFC]">
      <main className="flex-1 w-full">{children}</main>

      {/* Floating Luxury Frosted Capsule Navbar */}
      <nav
        aria-label="Navegación principal"
        className="fixed bottom-4 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none"
      >
        <div className="pointer-events-auto bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_16px_40px_rgba(15,23,42,0.12)] rounded-full px-2 py-1.5 flex items-center justify-between gap-1 max-w-sm w-full">
          {/* Salas */}
          <Link
            href="/"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs transition-all active:scale-95 ${
              isSalasActive
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100/60'
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs transition-all active:scale-95 ${
              isActividadActive
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100/60'
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs transition-all active:scale-95 ${
              isPerfilActive
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100/60'
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
