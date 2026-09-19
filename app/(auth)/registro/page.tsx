'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { reclamarCuentaVirtualAction } from '@/actions/salas.actions';
import { signUpAction } from '@/actions/auth.actions';

function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimToken = searchParams.get('claim_token') || '';

  const [name, setName] = useState('');
  const [nick, setNick] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const signUpRes = await signUpAction({ email, password, name, nick, phone });
      if (!signUpRes.success) {
        setErrorMessage(signUpRes.message);
        setLoading(false);
        return;
      }

      if (claimToken && signUpRes.userId) {
        const res = await reclamarCuentaVirtualAction(
          claimToken,
          signUpRes.userId,
          nick || name,
          phone
        );
        if (res.success) {
          setSuccessMessage(res.message);
          setTimeout(() => router.push('/'), 1200);
          return;
        } else {
          setErrorMessage(res.message);
        }
      } else {
        setSuccessMessage('Cuenta creada exitosamente.');
        setTimeout(() => router.push('/'), 800);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error durante el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[440px] w-full relative z-10 mx-auto">
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 border border-white/10 shadow-2xl overflow-hidden">
        {/* Edge Highlights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
        
        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <div className="relative group cursor-default">
            <div className="absolute inset-0 bg-emerald-400 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg transform transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
              <span className="material-symbols-outlined text-[32px]">person_add</span>
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight font-heading mb-1">
              Únete a Stitch
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              Tu monedero social, sin comisiones.
            </p>
          </div>
        </div>

        {claimToken && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
              <span className="material-symbols-outlined text-lg">stars</span>
              <span>¡Invitación de Mesa Detectada!</span>
            </div>
            <p className="text-emerald-200/70 text-xs leading-relaxed">
              Tu cuenta heredará automáticamente el historial de consumos y el balance neto acumulado de tu perfil de comensal virtual.
            </p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="material-symbols-outlined text-emerald-400 text-lg shrink-0">check_circle</span>
            <p className="text-emerald-200 text-sm font-medium leading-tight">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="material-symbols-outlined text-rose-400 text-lg shrink-0">error</span>
            <p className="text-rose-200 text-sm font-medium leading-tight">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          
          {/* Fila Doble: Nombre y Nick */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider ml-1">Nombre</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Carlos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-none bg-white/5 text-sm text-white placeholder-slate-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider ml-1">Alias (Nick)</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Charly"
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-none bg-white/5 text-sm text-white placeholder-slate-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider ml-1">Móvil (Para Bizum)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <span className="material-symbols-outlined text-[17px]">smartphone</span>
              </div>
              <input
                type="tel"
                placeholder="600 000 000 (Opcional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-none bg-white/5 text-sm text-white placeholder-slate-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <span className="material-symbols-outlined text-[17px]">mail</span>
              </div>
              <input
                type="email"
                required
                placeholder="hola@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-none bg-white/5 text-sm text-white placeholder-slate-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider ml-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <span className="material-symbols-outlined text-[17px]">lock</span>
              </div>
              <input
                type="password"
                required
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-none bg-white/5 text-sm text-white placeholder-slate-500 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative overflow-hidden w-full mt-3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  Procesando...
                </>
              ) : (
                <>
                  {claimToken ? 'Reclamar y Crear Cuenta' : 'Empezar ahora'}
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </span>
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-bold text-white hover:text-emerald-400 transition-colors underline decoration-emerald-500/30 hover:decoration-emerald-400 underline-offset-4">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-emerald-600/20 blur-[100px] animate-pulse"></div>
        <div className="absolute -bottom-[20%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-teal-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-emerald-400/10 blur-[80px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <Suspense fallback={<div className="text-sm text-slate-400 font-medium z-10 relative">Cargando...</div>}>
        <RegistroForm />
      </Suspense>
    </div>
  );
}
