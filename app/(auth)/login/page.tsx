'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInAction } from '@/actions/auth.actions';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await signInAction({ email, password });
      if (res.success) {
        router.push('/');
      } else {
        setErrorMessage(res.message || 'Credenciales incorrectas');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-emerald-600/20 blur-[100px] animate-pulse"></div>
        <div className="absolute -bottom-[20%] -left-[20%] w-[60vw] h-[60vw] rounded-full bg-teal-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-emerald-400/10 blur-[80px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-[400px] w-full relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 border border-white/10 shadow-2xl overflow-hidden">
          {/* Edge Highlights */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
          
          <div className="flex flex-col items-center text-center gap-4 mb-8">
            <div className="relative group cursor-default">
              <div className="absolute inset-0 bg-emerald-400 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg transform transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                <span className="material-symbols-outlined text-[32px]">payments</span>
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight font-heading mb-1">
                Stitch
              </h1>
              <p className="text-sm text-slate-400 font-medium">
                Sincroniza tus cuentas, sin fricciones.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-rose-400 text-lg shrink-0">error</span>
              <p className="text-rose-200 text-sm font-medium leading-tight">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <span className="material-symbols-outlined text-lg">mail</span>
                </div>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@stitch.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-none bg-white/5 text-sm text-white placeholder-slate-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Contraseña</label>
                <a href="#" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                  ¿Olvidada?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <span className="material-symbols-outlined text-lg">lock</span>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-none bg-white/5 text-sm text-white placeholder-slate-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative overflow-hidden w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    Conectando...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              ¿Eres nuevo por aquí?{' '}
              <Link href="/registro" className="font-bold text-white hover:text-emerald-400 transition-colors underline decoration-emerald-500/30 hover:decoration-emerald-400 underline-offset-4">
                Crea tu cuenta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
