'use client';

import React, { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInGuestAction } from '@/actions/auth.actions';
import { joinSalaGuestAction } from '@/actions/salas.actions';
import { getCurrentUserAction } from '@/actions/user.actions';

export default function JoinSalaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  
  const [nick, setNick] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [existingUser, setExistingUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUserAction();
        if (user && !user.is_anonymous) {
          setExistingUser(user);
          setNick(user.nick || user.name);
        }
      } catch (err) {
        console.error('Error al chequear sesión', err);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkUser();
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nick.trim()) {
      setError('Por favor, introduce tu nombre');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (!existingUser) {
        // 1. Iniciar sesión como invitado (anónimo) si no está logueado
        const authRes = await signInGuestAction(nick);
        if (!authRes.success) {
          throw new Error(authRes.message);
        }
      }
      
      // 2. Unirse a la sala como miembro
      const joinRes = await joinSalaGuestAction(slug, nick);
      if (!joinRes.success) {
        throw new Error('No se pudo unir a la sala');
      }
      
      // 3. Redirigir a la sala
      router.push(`/sala/${slug}`);
      
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al unirse a la sala');
      setLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
          <span className="material-symbols-outlined text-3xl">waving_hand</span>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">¡Te han invitado!</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Estás a punto de unirte a una mesa en LaRonda.
            {!existingUser && ' Escribe tu nombre para que los demás sepan quién eres.'}
          </p>
        </div>

        <form onSubmit={handleJoin} className="w-full flex flex-col gap-4">
          {existingUser ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                {existingUser.avatar_url ? (
                  <img src={existingUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-sm uppercase">
                    {nick.substring(0, 2)}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-xs text-slate-500 font-medium">Entrando como</span>
                <span className="text-sm font-bold text-slate-900 truncate w-full">{nick}</span>
              </div>
            </div>
          ) : (
            <div className="text-left">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Tu Nombre o Apodo</label>
              <input
                type="text"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                placeholder="Ej. Juan Pérez"
                disabled={loading}
                maxLength={20}
                required
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !nick.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-3.5 px-4 font-semibold text-sm transition-all shadow-sm shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Entrar a la mesa
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </form>
        
        {!existingUser && (
          <p className="text-[11px] text-slate-400 font-medium">
            Entrarás en modo Invitado. No necesitas contraseña.
          </p>
        )}
      </div>
    </div>
  );
}
