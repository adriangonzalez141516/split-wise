'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServer } from '@/lib/supabase/server';
import {
  getSalas as getLocalSalas,
  getSalaById as getLocalSalaById,
  createSala as createLocalSala,
  addVirtualMember as addLocalVirtualMember,
  claimAccount as claimLocalAccount,
} from '@/lib/store';
import { Sala, Member, TicketItem } from '@/lib/types';
import { getCurrentUserAction } from '@/actions/user.actions';

export async function getSalasAction(): Promise<Sala[]> {
  try {
    const supabase = await getSupabaseServer();
    const { data: salasData, error } = await supabase
      .from('salas')
      .select(`
        *,
        members:sala_members(*),
        eventos(
          *,
          items:ticket_items(
            *,
            assignments:ticket_item_assignments(*)
          ),
          liquidaciones(*)
        )
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
        eventos: (s.eventos || [])
          .sort(
            (a: Record<string, unknown>, b: Record<string, unknown>) =>
              new Date(String(b.created_at || b.date || 0)).getTime() -
              new Date(String(a.created_at || a.date || 0)).getTime()
          )
          .map((e: Record<string, unknown>) => ({
          id: String(e.id),
          salaId: String(e.sala_id || s.id),
          title: String(e.title),
          venue: String(e.venue),
          date: String(e.date),
          status: (e.status as 'en_curso' | 'cerrado') || 'en_curso',
          originalPayerId: String(e.original_payer_id || 'm1'),
          items: ((e.items as Array<Record<string, unknown>>) || []).map((it) => ({
            id: String(it.id),
            name: String(it.name),
            quantity: Number(it.quantity || 1),
            unit_price: Number(it.unit_price || 0),
            total_price: Number(it.total_price || 0),
            category: (it.category as TicketItem['category']) || 'food',
            assignedMemberIds: ((it.assignments as Array<Record<string, unknown>>) || []).map((a) =>
              String(a.member_id)
            ),
          })),
          commonCosts: [],
          globalModifiers: {},
          totalAmount: Number(e.total_amount || 0),
          transactions: ((e.liquidaciones as Array<Record<string, unknown>>) || []).map((l) => ({
            id: String(l.id),
            fromMemberId: String(l.from_member_id),
            toMemberId: String(l.to_member_id),
            amount: Number(l.amount || 0),
            status: (l.status as 'propuesta' | 'pendiente' | 'consolidado') || 'propuesta',
            suggestedAt: String(l.suggested_at || new Date().toISOString()),
            updatedAt: String(l.updated_at || new Date().toISOString()),
            note: l.note ? String(l.note) : undefined,
            ruleApplied: (l.rule_applied as 'regla_1' | 'regla_2' | 'regla_3' | 'regla_4_min_cash_flow') || 'regla_4_min_cash_flow',
          })),
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
    const supabase = await getSupabaseServer();
    const { data: s, error } = await supabase
      .from('salas')
      .select(`
        *,
        members:sala_members(*),
        eventos(
          *,
          items:ticket_items(
            *,
            assignments:ticket_item_assignments(*)
          ),
          liquidaciones(*)
        )
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
        eventos: (s.eventos || [])
          .sort(
            (a: Record<string, unknown>, b: Record<string, unknown>) =>
              new Date(String(b.created_at || b.date || 0)).getTime() -
              new Date(String(a.created_at || a.date || 0)).getTime()
          )
          .map((e: Record<string, unknown>) => ({
          id: String(e.id),
          salaId: String(e.sala_id || s.id),
          title: String(e.title),
          venue: String(e.venue),
          date: String(e.date),
          status: (e.status as 'en_curso' | 'cerrado') || 'en_curso',
          originalPayerId: String(e.original_payer_id || 'm1'),
          items: ((e.items as Array<Record<string, unknown>>) || []).map((it) => ({
            id: String(it.id),
            name: String(it.name),
            quantity: Number(it.quantity || 1),
            unit_price: Number(it.unit_price || 0),
            total_price: Number(it.total_price || 0),
            category: (it.category as TicketItem['category']) || 'food',
            assignedMemberIds: ((it.assignments as Array<Record<string, unknown>>) || []).map((a) =>
              String(a.member_id)
            ),
          })),
          commonCosts: [],
          globalModifiers: {},
          totalAmount: Number(e.total_amount || 0),
          transactions: ((e.liquidaciones as Array<Record<string, unknown>>) || []).map((l) => ({
            id: String(l.id),
            fromMemberId: String(l.from_member_id),
            toMemberId: String(l.to_member_id),
            amount: Number(l.amount || 0),
            status: (l.status as 'propuesta' | 'pendiente' | 'consolidado') || 'propuesta',
            suggestedAt: String(l.suggested_at || new Date().toISOString()),
            updatedAt: String(l.updated_at || new Date().toISOString()),
            note: l.note ? String(l.note) : undefined,
            ruleApplied: (l.rule_applied as 'regla_1' | 'regla_2' | 'regla_3' | 'regla_4_min_cash_flow') || 'regla_4_min_cash_flow',
          })),
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
  const currentUser = await getCurrentUserAction();
  if (!currentUser) throw new Error('No autorizado');

  const salaSlug =
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') +
    '-' +
    Date.now().toString().slice(-4);

  const creatorMemberId = currentUser.id;

  const localSala = createLocalSala(name, description, creatorMemberId);
  localSala.id = salaSlug;
  localSala.members = [
    {
      id: creatorMemberId,
      name: currentUser.nick || currentUser.name,
      phone: currentUser.phone || undefined,
      avatarUrl: currentUser.avatar_url || undefined,
      isVirtual: false,
    },
  ];

  try {
    const supabase = await getSupabaseServer();
    const { error: salaError } = await supabase.from('salas').insert({
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

    if (salaError) {
      console.error('[Supabase] Error al crear sala en Supabase:', salaError);
    }

    const { error: memberError } = await supabase.from('sala_members').insert({
      id: creatorMemberId,
      sala_id: localSala.id,
      name: currentUser.nick || currentUser.name,
      phone: currentUser.phone || null,
      avatar_url: currentUser.avatar_url || null,
      is_virtual: false,
      user_id: creatorMemberId,
      registered_user_id: creatorMemberId,
    });

    if (memberError) {
      console.error('[Supabase] Error al insertar creador en sala_members:', memberError);
    }
  } catch (err) {
    console.warn('[Supabase] Fallo al insertar sala en Supabase:', err);
  }

  revalidatePath('/');
  revalidatePath(`/sala/${localSala.id}`);
  return localSala;
}

export async function anadirMiembroVirtualAction(salaId: string, name: string): Promise<Member | null> {
  const memberId = `guest-${Date.now().toString().slice(-6)}`;
  const cleanName = name.trim().endsWith('*') ? name.trim() : `${name.trim()}*`;
  const claimToken = `token-${Math.random().toString(36).substring(2, 8)}`;

  const newMember: Member = {
    id: memberId,
    name: cleanName,
    alias: cleanName,
    isVirtual: true,
    claimToken,
  };

  try {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.from('sala_members').insert({
      id: newMember.id,
      sala_id: salaId,
      name: newMember.name,
      is_virtual: true,
      claim_token: newMember.claimToken,
    });
    if (error) {
      console.error('[Supabase] Error al insertar miembro virtual:', error);
    }
  } catch (err) {
    console.warn('[Supabase] Fallo al insertar miembro virtual en Supabase:', err);
  }

  // Sincronizar en store local si existe la sala
  const localSala = getLocalSalaById(salaId);
  if (localSala) {
    localSala.members.push(newMember);
  }

  revalidatePath(`/sala/${salaId}`);
  revalidatePath('/');
  return newMember;
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
      const supabase = await getSupabaseServer();
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
  buyerMemberId?: string
): Promise<{ success: boolean; message: string }> {
  let effectiveBuyerId = buyerMemberId;
  if (!effectiveBuyerId) {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) return { success: false, message: 'No autorizado' };
    effectiveBuyerId = currentUser.id;
  }
  
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
    const supabase = await getSupabaseServer();
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
