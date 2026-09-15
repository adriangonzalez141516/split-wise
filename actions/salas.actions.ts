'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServer } from '@/lib/supabase/server';
import {
  getSalas as getLocalSalas,
  getSalaById as getLocalSalaById,
  createSala as createLocalSala,
  addVirtualMember as addLocalVirtualMember,
  claimAccount as claimLocalAccount,
  CURRENT_USER_ID,
} from '@/lib/store';
import { Sala, Member } from '@/lib/types';

export async function getSalasAction(): Promise<Sala[]> {
  try {
    const supabase = getSupabaseServer();
    const { data: salasData, error } = await supabase
      .from('salas')
      .select(`
        *,
        members:sala_members(*),
        eventos(*)
      `)
      .order('created_at', { ascending: false });

    if (!error && salasData && salasData.length > 0) {
      return salasData.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        icon: s.icon || 'groups',
        debtThreshold: Number(s.debt_threshold || -50),
        boteComun: Number(s.bote_comun || 0),
        pass: {
          type: s.pass_type || 'pase_sala',
          status: s.pass_status || 'activo',
          eventsUsed: s.pass_events_used || 0,
          maxEvents: s.pass_max_events || 20,
        },
        members: (s.members || []).map((m: Record<string, unknown>) => ({
          id: String(m.id),
          name: String(m.name),
          phone: m.phone ? String(m.phone) : undefined,
          avatarUrl: m.avatar_url ? String(m.avatar_url) : undefined,
          isVirtual: Boolean(m.is_virtual),
          claimToken: m.claim_token ? String(m.claim_token) : undefined,
        })),
        eventos: (s.eventos || []).map((e: Record<string, unknown>) => ({
          id: String(e.id),
          salaId: String(e.sala_id || s.id),
          title: String(e.title),
          venue: String(e.venue),
          date: String(e.date),
          status: (e.status as 'en_curso' | 'cerrado') || 'en_curso',
          originalPayerId: String(e.original_payer_id || 'm1'),
          items: [],
          commonCosts: [],
          globalModifiers: {},
          totalAmount: Number(e.total_amount || 0),
          transactions: [],
        })),
        createdAt: s.created_at || new Date().toISOString(),
        lastActivityAt: s.last_activity_at || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.warn('[Supabase] Usando almacén local para getSalasAction:', err);
  }

  return getLocalSalas();
}

export async function getSalaDetailAction(salaId: string): Promise<Sala | null> {
  try {
    const supabase = getSupabaseServer();
    const { data: s, error } = await supabase
      .from('salas')
      .select(`
        *,
        members:sala_members(*),
        eventos(*)
      `)
      .eq('id', salaId)
      .single();

    if (!error && s) {
      return {
        id: s.id,
        name: s.name,
        description: s.description || '',
        icon: s.icon || 'groups',
        debtThreshold: Number(s.debt_threshold || -50),
        boteComun: Number(s.bote_comun || 0),
        pass: {
          type: s.pass_type || 'pase_sala',
          status: s.pass_status || 'activo',
          eventsUsed: s.pass_events_used || 0,
          maxEvents: s.pass_max_events || 20,
        },
        members: (s.members || []).map((m: Record<string, unknown>) => ({
          id: String(m.id),
          name: String(m.name),
          phone: m.phone ? String(m.phone) : undefined,
          avatarUrl: m.avatar_url ? String(m.avatar_url) : undefined,
          isVirtual: Boolean(m.is_virtual),
          claimToken: m.claim_token ? String(m.claim_token) : undefined,
        })),
        eventos: (s.eventos || []).map((e: Record<string, unknown>) => ({
          id: String(e.id),
          salaId: String(e.sala_id || s.id),
          title: String(e.title),
          venue: String(e.venue),
          date: String(e.date),
          status: (e.status as 'en_curso' | 'cerrado') || 'en_curso',
          originalPayerId: String(e.original_payer_id || 'm1'),
          items: [],
          commonCosts: [],
          globalModifiers: {},
          totalAmount: Number(e.total_amount || 0),
          transactions: [],
        })),
        createdAt: s.created_at || new Date().toISOString(),
        lastActivityAt: s.last_activity_at || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[Supabase] Usando almacén local para getSalaDetailAction:', err);
  }

  const localSala = getLocalSalaById(salaId);
  return localSala || null;
}

export async function crearSalaAction(name: string, description: string): Promise<Sala> {
  const localSala = createLocalSala(name, description, CURRENT_USER_ID);

  try {
    const supabase = getSupabaseServer();
    await supabase.from('salas').insert({
      id: localSala.id,
      name: localSala.name,
      description: localSala.description,
      icon: localSala.icon,
      debt_threshold: localSala.debtThreshold,
      bote_comun: localSala.boteComun,
      pass_type: localSala.pass.type,
      pass_status: localSala.pass.status,
      pass_events_used: localSala.pass.eventsUsed,
      pass_max_events: localSala.pass.maxEvents,
    });

    if (localSala.members && localSala.members.length > 0) {
      await supabase.from('sala_members').insert(
        localSala.members.map((m) => ({
          id: m.id,
          sala_id: localSala.id,
          name: m.name,
          phone: m.phone || null,
          avatar_url: m.avatarUrl || null,
          is_virtual: m.isVirtual,
        }))
      );
    }
  } catch (err) {
    console.warn('[Supabase] Fallo al insertar sala en Supabase:', err);
  }

  revalidatePath('/');
  return localSala;
}

export async function anadirMiembroVirtualAction(salaId: string, name: string): Promise<Member | null> {
  const member = addLocalVirtualMember(salaId, name);

  if (member) {
    try {
      const supabase = getSupabaseServer();
      await supabase.from('sala_members').insert({
        id: member.id,
        sala_id: salaId,
        name: member.name,
        is_virtual: true,
        claim_token: member.claimToken || null,
      });
    } catch (err) {
      console.warn('[Supabase] Fallo al insertar miembro virtual en Supabase:', err);
    }

    revalidatePath(`/sala/${salaId}`);
  }

  return member || null;
}

export async function reclamarCuentaVirtualAction(
  claimToken: string,
  newUserId: string,
  newUserName: string,
  newUserPhone?: string
): Promise<{ success: boolean; message: string }> {
  const success = claimLocalAccount(claimToken, newUserId, newUserName, newUserPhone);

  if (success) {
    try {
      const supabase = getSupabaseServer();
      await supabase
        .from('sala_members')
        .update({
          is_virtual: false,
          user_id: newUserId,
          name: newUserName,
          phone: newUserPhone || null,
          registered_user_id: newUserId,
        })
        .eq('claim_token', claimToken);
    } catch (err) {
      console.warn('[Supabase] Fallo al sincronizar claim con Supabase:', err);
    }

    revalidatePath('/');
    return { success: true, message: 'Cuenta vinculada exitosamente. Se ha migrado tu saldo e histórico.' };
  }
  return { success: false, message: 'Token de claim inválido o expirado.' };
}

export async function comprarPaseSalaAction(
  salaId: string,
  buyerMemberId: string = CURRENT_USER_ID
): Promise<{ success: boolean; message: string }> {
  const sala = getLocalSalaById(salaId);
  if (!sala) return { success: false, message: 'Sala no encontrada' };

  sala.pass = {
    type: 'pase_sala',
    status: 'activo',
    eventsUsed: 0,
    maxEvents: 20,
    purchasedByMemberId: buyerMemberId,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };

  try {
    const supabase = getSupabaseServer();
    await supabase
      .from('salas')
      .update({
        pass_status: 'activo',
        pass_events_used: 0,
        pass_max_events: 20,
      })
      .eq('id', salaId);
  } catch (err) {
    console.warn('[Supabase] Fallo al actualizar pase en Supabase:', err);
  }

  revalidatePath(`/sala/${salaId}`);

  return {
    success: true,
    message: 'Pase de Sala activado. Coste de 4,99 € repartido equitativamente entre los miembros de la sala.',
  };
}
