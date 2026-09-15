'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { reclamarCuentaVirtualAction } from '@/actions/salas.actions';

function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimToken = searchParams.get('claim_token') || '';

  const [name, setName] = useState(claimToken ? 'Marta' : '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(claimToken ? '654 112 233' : '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (claimToken) {
        // Run Claim Account migration
        const res = await reclamarCuentaVirtualAction(
          claimToken,
          `user-${Date.now().toString().slice(-4)}`,
          name,
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
        // Standard registration
        setTimeout(() => router.push('/'), 600);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error durante el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm w-full bg-white rounded-3xl p-8 border border-outline-variant/30 shadow-[0_12px_32px_-4px_rgba(17,24,39,0.06)] flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xs">
          <span className="material-symbols-outlined text-[28px]">person_add</span>
        </div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Crear Cuenta</h1>
        <p className="text-xs text-outline">Únete a Stitch y sincroniza tus gastos compartidos</p>
      </div>

      {/* Claim Account Token Banner */}
      {claimToken && (
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <span className="material-symbols-outlined text-base text-emerald-700">stars</span>
            <span>¡Invitación de Mesa Detectada!</span>
          </div>
          <p className="text-emerald-800/80 leading-relaxed">
            Tu cuenta heredará automáticamente el historial de consumos y el balance neto acumulado de tu perfil de comensal virtual.
          </p>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-100 text-emerald-800 text-xs rounded-xl font-medium">
          {successMessage} Redirigiendo a tus salas...
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-100 text-red-800 text-xs rounded-xl font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
        <div>
          <label className="text-xs font-semibold text-on-surface block mb-1">Nombre y Apellidos</label>
          <input
            type="text"
            required
            placeholder="ej. Carlos García"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 text-xs bg-surface focus:outline-primary transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-on-surface block mb-1">Teléfono móvil (para Bizum)</label>
          <input
            type="tel"
            required
            placeholder="600 000 000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 text-xs bg-surface focus:outline-primary transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-on-surface block mb-1">Correo electrónico</label>
          <input
            type="email"
            required
            placeholder="nombre@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 text-xs bg-surface focus:outline-primary transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-on-surface block mb-1">Contraseña</label>
          <input
            type="password"
            required
            placeholder="Mínimo 8 caracteres"
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
          {loading ? 'Procesando...' : claimToken ? 'Reclamar y Crear Cuenta' : 'Registrarme'}
        </button>
      </form>

      <div className="text-center text-xs text-outline pt-2 border-t border-outline-variant/20">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12 bg-surface">
      <Suspense fallback={<div className="text-xs text-outline">Cargando...</div>}>
        <RegistroForm />
      </Suspense>
    </div>
  );
}
