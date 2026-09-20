'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signOutAction } from '@/actions/auth.actions';
import { updateUserProfileAction } from '@/actions/user.actions';
import { useRouter } from 'next/navigation';

interface UserData {
  id: string;
  name: string;
  nick: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_anonymous?: boolean;
}

export default function PerfilView({
  user,
  wallet,
}: {
  user: UserData;
  wallet: { totalPorCobrar: number; totalPorPagar: number };
}) {
  const router = useRouter();
  const [nick, setNick] = useState(user.nick || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await updateUserProfileAction({ nick, phone });
      if (res.success) {
        setMessage({ text: 'Perfil actualizado con éxito', type: 'success' });
        router.refresh();
      } else {
        setMessage({ text: res.message || 'Error al actualizar', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Error de conexión', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOutAction();
    router.push('/login');
  };

  const handleDeleteAccount = () => {
    if (wallet.totalPorCobrar !== 0 || wallet.totalPorPagar !== 0) {
      setMessage({ text: 'No puedes borrar tu cuenta mientras tengas deudas pendientes.', type: 'error' });
      return;
    }
    setMessage({ text: 'El borrado de cuentas está desactivado en la versión de prueba.', type: 'error' });
  };

  // VISTA PARA INVITADOS
  if (user.is_anonymous) {
    return (
      <div className="w-full max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="py-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
            Mi Perfil
          </h1>
          <Link href="/" className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
            Volver
          </Link>
        </header>

        <section className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 p-8 shadow-xl flex flex-col items-center text-center gap-6 mt-4 relative overflow-hidden">
          {/* Decorative background blur */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center shadow-inner border border-white/50 dark:border-white/10 rotate-3 transition-transform hover:rotate-6">
            <span className="text-4xl">👋</span>
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Cuenta de Invitado</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-4">
              Estás usando LaRonda de forma temporal. Para guardar tu progreso, sincronizar tus pagos y acceder desde cualquier dispositivo, crea una cuenta gratis.
            </p>
          </div>

          <div className="w-full flex flex-col gap-3 mt-2">
            <Link 
              href={`/registro?callbackUrl=/perfil`}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-600 text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 group"
            >
              <span>Crear Cuenta Gratis</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            
            <Link 
              href={`/login?callbackUrl=/perfil`}
              className="w-full py-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-slate-800"
            >
              Ya tengo cuenta (Iniciar Sesión)
            </Link>
          </div>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full py-3.5 rounded-2xl text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Cerrar Sesión Temporal
        </button>
      </div>
    );
  }

  // VISTA NORMAL PARA USUARIOS LOGUEADOS
  return (
    <div className="w-full max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">
      <header className="py-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
          Mi Perfil & Ajustes
        </h1>
        <Link href="/" className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
          Volver
        </Link>
      </header>

      {/* Avatar Section */}
      <section className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center text-center gap-3">
        <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-emerald-50 dark:ring-emerald-900/20 bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl text-emerald-800 dark:text-emerald-300 font-bold">
              {(user.nick || user.name).charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{user.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>

        <div className="w-full grid grid-cols-2 gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/50">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Por cobrar</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg tabular-nums mt-0.5">
              {wallet.totalPorCobrar.toFixed(2).replace('.', ',')} €
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Por pagar</span>
            <span className="font-black text-amber-600 dark:text-amber-500 text-lg tabular-nums mt-0.5">
              {wallet.totalPorPagar.toFixed(2).replace('.', ',')} €
            </span>
          </div>
        </div>
      </section>

      {/* Edit Profile Form */}
      <section className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
          Datos Personales
        </h3>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-xs font-bold ${
            message.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40' 
              : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">Alias (Nick)</label>
            <input
              type="text"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="Ej. Charly"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">Móvil (Para Bizum)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. 600 123 456"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
            Guardar Cambios
          </button>
        </form>
      </section>

      {/* Account Actions */}
      <section className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-3">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Cerrar Sesión
        </button>

        <button
          type="button"
          onClick={handleDeleteAccount}
          className="w-full py-3.5 rounded-2xl text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">delete_forever</span>
          Eliminar Cuenta
        </button>
      </section>
    </div>
  );
}
