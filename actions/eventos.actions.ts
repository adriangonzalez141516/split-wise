'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServer } from '@/lib/supabase/server';
import {
  getEventoById as getLocalEventoById,
  getSalaById as getLocalSalaById,
  toggleItemClaim as toggleLocalItemClaim,
  excludeAlcoholForMember as excludeLocalAlcoholForMember,
  addItemToEvento as addLocalItemToEvento,
  addMultipleItemsToEvento as addLocalMultipleItemsToEvento,
  createEvento as createLocalEvento,
  CURRENT_USER_ID,
} from '@/lib/store';
import { Evento, TicketItem } from '@/lib/types';
import { calculateMinCashFlow, identifySuggestedPayer } from '@/lib/min-cash-flow';

export async function getEventoDetailAction(salaId: string, eventoId: string): Promise<Evento | null> {
  try {
    const supabase = getSupabaseServer();
    const { data: e, error } = await supabase
      .from('eventos')
      .select(`
        *,
        items:ticket_items(
          *,
          assignments:ticket_item_assignments(*)
        ),
        liquidaciones(*)
      `)
      .eq('id', eventoId)
      .single();

    if (!error && e) {
      return {
        id: e.id,
        salaId: e.sala_id,
        title: e.title,
        venue: e.venue,
        date: e.date,
        status: e.status as 'en_curso' | 'cerrado',
        originalPayerId: e.original_payer_id || 'm1',
        items: (e.items || []).map((item: Record<string, unknown>) => ({
          id: String(item.id),
          name: String(item.name),
          quantity: Number(item.quantity || 1),
          unit_price: Number(item.unit_price || 0),
          total_price: Number(item.total_price || 0),
          category: (item.category as TicketItem['category']) || 'food',
          assignedMemberIds: ((item.assignments as Array<Record<string, unknown>>) || []).map((a) =>
            String(a.member_id)
          ),
        })),
        commonCosts: [],
        globalModifiers: {},
        totalAmount: Number(e.total_amount || 0),
        transactions: (e.liquidaciones || []).map((l: Record<string, unknown>) => ({
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
      };
    }
  } catch (err) {
    console.warn('[Supabase] Usando almacén local para getEventoDetailAction:', err);
  }

  const localEvento = getLocalEventoById(salaId, eventoId);
  return localEvento || null;
}

export async function togglePlatoClaimAction(
  salaId: string,
  eventoId: string,
  itemId: string,
  memberId: string = CURRENT_USER_ID
): Promise<{ success: boolean; item?: TicketItem }> {
  const success = toggleLocalItemClaim(salaId, eventoId, itemId, memberId);
  const evento = getLocalEventoById(salaId, eventoId);
  const item = evento?.items.find((i) => i.id === itemId);

  try {
    const supabase = getSupabaseServer();
    if (item?.assignedMemberIds.includes(memberId)) {
      await supabase.from('ticket_item_assignments').insert({
        item_id: itemId,
        member_id: memberId,
      });
    } else {
      await supabase
        .from('ticket_item_assignments')
        .delete()
        .eq('item_id', itemId)
        .eq('member_id', memberId);
    }
  } catch (err) {
    console.warn('[Supabase] Fallo al sincronizar toggle plato:', err);
  }

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  return { success, item };
}

export async function excluirAlcoholAction(
  salaId: string,
  eventoId: string,
  memberId: string = CURRENT_USER_ID,
  exclude: boolean = true
): Promise<{ success: boolean }> {
  excludeLocalAlcoholForMember(salaId, eventoId, memberId, exclude);
  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  return { success: true };
}

export async function repartirCostesComunesAction(
  salaId: string,
  eventoId: string,
  splitType: 'equitativo' | 'proporcional'
): Promise<{ success: boolean }> {
  const evento = getLocalEventoById(salaId, eventoId);
  if (!evento) return { success: false };

  for (const cc of evento.commonCosts) {
    cc.splitType = splitType;
  }

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  return { success: true };
}

export async function consolidarEventoAction(
  salaId: string,
  eventoId: string
): Promise<{ success: boolean; message: string }> {
  const sala = getLocalSalaById(salaId);
  const evento = getLocalEventoById(salaId, eventoId);
  if (!sala || !evento) return { success: false, message: 'Evento no encontrado' };

  const activeMembers = sala.members;
  const balances: { memberId: string; netBalance: number }[] = [];

  for (const member of activeMembers) {
    let consumption = 0;

    for (const item of evento.items) {
      if (item.assignedMemberIds.includes(member.id)) {
        consumption += item.total_price / (item.assignedMemberIds.length || 1);
      }
    }

    for (const cc of evento.commonCosts) {
      consumption += cc.amount / (activeMembers.length || 1);
    }

    const isPayer = evento.originalPayerId === member.id;
    const advance = isPayer ? evento.totalAmount : 0;

    const net = advance - consumption;
    balances.push({ memberId: member.id, netBalance: Math.round(net * 100) / 100 });
  }

  const optimizedTx = calculateMinCashFlow(balances, evento.originalPayerId);
  evento.transactions = optimizedTx;
  evento.suggestedPayerId = identifySuggestedPayer(balances);

  try {
    const supabase = getSupabaseServer();
    await supabase.from('eventos').update({ status: 'cerrado' }).eq('id', eventoId);

    if (optimizedTx.length > 0) {
      await supabase.from('liquidaciones').upsert(
        optimizedTx.map((tx) => ({
          id: tx.id,
          sala_id: salaId,
          evento_id: eventoId,
          from_member_id: tx.fromMemberId,
          to_member_id: tx.toMemberId,
          amount: tx.amount,
          status: tx.status,
          rule_applied: tx.ruleApplied,
          note: tx.note || null,
        }))
      );
    }
  } catch (err) {
    console.warn('[Supabase] Fallo al sincronizar consolidación en Supabase:', err);
  }

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  return { success: true, message: 'Evento consolidado con optimización Min-Cash-Flow' };
}

export async function anadirPlatoAction(
  salaId: string,
  eventoId: string,
  platoData: Omit<TicketItem, 'id'>
): Promise<{ success: boolean; item?: TicketItem }> {
  const item = addLocalItemToEvento(salaId, eventoId, platoData);

  if (item) {
    try {
      const supabase = getSupabaseServer();
      await supabase.from('ticket_items').insert({
        id: item.id,
        evento_id: eventoId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        category: item.category,
      });

      if (item.assignedMemberIds.length > 0) {
        await supabase.from('ticket_item_assignments').insert(
          item.assignedMemberIds.map((mId) => ({
            item_id: item.id,
            member_id: mId,
          }))
        );
      }
    } catch (err) {
      console.warn('[Supabase] Fallo al sincronizar plato en Supabase:', err);
    }
  }

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  revalidatePath(`/sala/${salaId}`);
  return { success: !!item, item };
}

export async function anadirPlatosDesdeTicketAction(
  salaId: string,
  eventoId: string,
  platos: Omit<TicketItem, 'id'>[]
): Promise<{ success: boolean; addedCount: number; items: TicketItem[] }> {
  const items = addLocalMultipleItemsToEvento(salaId, eventoId, platos);

  if (items.length > 0) {
    try {
      const supabase = getSupabaseServer();
      for (const item of items) {
        await supabase.from('ticket_items').insert({
          id: item.id,
          evento_id: eventoId,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          category: item.category,
        });

        if (item.assignedMemberIds.length > 0) {
          await supabase.from('ticket_item_assignments').insert(
            item.assignedMemberIds.map((mId) => ({
              item_id: item.id,
              member_id: mId,
            }))
          );
        }
      }
    } catch (err) {
      console.warn('[Supabase] Fallo al sincronizar platos múltiples:', err);
    }
  }

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  revalidatePath(`/sala/${salaId}`);
  return { success: items.length > 0, addedCount: items.length, items };
}

export async function crearEventoAction(
  salaId: string,
  eventData: {
    title: string;
    venue: string;
    table?: string;
    date?: string;
    originalPayerId?: string;
  }
): Promise<{ success: boolean; evento?: Evento }> {
  const newEventoId = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const dateStr = eventData.date || new Date().toISOString().split('T')[0];
  const titleStr = eventData.title || eventData.venue || 'Nuevo Evento';
  const venueStr = eventData.venue || 'Restaurante';
  const payerId = eventData.originalPayerId || 'm1';

  const newEvento: Evento = {
    id: newEventoId,
    salaId,
    title: titleStr,
    venue: venueStr,
    table: eventData.table || 'Mesa 1',
    date: dateStr,
    status: 'en_curso',
    originalPayerId: payerId,
    suggestedPayerId: payerId,
    items: [],
    commonCosts: [],
    globalModifiers: {},
    totalAmount: 0,
    transactions: [],
  };

  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.from('eventos').insert({
      id: newEvento.id,
      sala_id: salaId,
      title: newEvento.title,
      venue: newEvento.venue,
      date: newEvento.date,
      status: 'en_curso',
      original_payer_id: newEvento.originalPayerId,
      total_amount: 0,
    });

    if (error) {
      console.error('[Supabase] Error al insertar evento:', error);
    }
  } catch (err) {
    console.warn('[Supabase] Fallo al insertar evento en Supabase:', err);
  }

  const localSala = getLocalSalaById(salaId);
  if (localSala) {
    localSala.eventos.unshift(newEvento);
  }

  revalidatePath(`/sala/${salaId}`);
  revalidatePath(`/sala/${salaId}/evento/${newEvento.id}`);
  revalidatePath('/');
  return { success: true, evento: newEvento };
}
