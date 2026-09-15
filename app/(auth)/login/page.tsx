'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('carlos@stitch.app');
  const [password, setPassword] = useState('••••••••');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/');
    }, 500);
  };

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12 bg-surface">
      <div className="max-w-sm w-full bg-white rounded-3xl p-8 border border-outline-variant/30 shadow-[0_12px_32px_-4px_rgba(17,24,39,0.06)] flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-[28px]">payments</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Stitch</h1>
          <p className="text-xs text-outline">Plataforma de Gastos Compartidos &amp; Reparto en Vivo</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-on-surface block mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 text-xs bg-surface focus:outline-primary transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-on-surface">Contraseña</label>
              <a href="#" className="text-[11px] text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 text-xs bg-surface focus:outline-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] w-full mt-2 py-2.5 rounded-xl bg-primary hover:bg-emerald-700 active:scale-98 text-white font-semibold text-xs transition-all shadow-xs"
          >
            {loading ? 'Accediendo...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center text-xs text-outline pt-2 border-t border-outline-variant/20">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-primary font-semibold hover:underline">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
