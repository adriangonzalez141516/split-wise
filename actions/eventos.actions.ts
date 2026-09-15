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
  let isAssignedNow = false;

  try {
    const supabase = getSupabaseServer();

    // Resolver memberId válido para esta sala (defensa ante fallbacks)
    let effectiveMemberId = memberId;
    const { data: memberInSala } = await supabase
      .from('sala_members')
      .select('id')
      .eq('sala_id', salaId)
      .eq('id', memberId)
      .maybeSingle();

    if (!memberInSala) {
      const { data: fallbackMember } = await supabase
        .from('sala_members')
        .select('id')
        .eq('sala_id', salaId)
        .ilike('name', '%Carlos%')
        .maybeSingle();

      if (fallbackMember) {
        effectiveMemberId = fallbackMember.id;
      } else {
        const { data: firstMember } = await supabase
          .from('sala_members')
          .select('id')
          .eq('sala_id', salaId)
          .limit(1)
          .maybeSingle();
        if (firstMember) effectiveMemberId = firstMember.id;
      }
    }

    // Comprobar si ya existe asignación en Supabase
    const { data: existing, error: checkError } = await supabase
      .from('ticket_item_assignments')
      .select('id')
      .eq('item_id', itemId)
      .eq('member_id', effectiveMemberId)
      .maybeSingle();

    if (checkError) {
      console.warn('[Supabase] Error al consultar ticket_item_assignments:', checkError);
    }

    if (existing) {
      // Si ya estaba asignado -> Eliminar asignación (desmarcar)
      const { error: delError } = await supabase
        .from('ticket_item_assignments')
        .delete()
        .eq('item_id', itemId)
        .eq('member_id', effectiveMemberId);

      if (delError) {
        console.error('[Supabase] Error al eliminar asignación:', delError);
      } else {
        isAssignedNow = false;
      }
    } else {
      // Si no estaba asignado -> Insertar asignación (marcar)
      const { error: insError } = await supabase
        .from('ticket_item_assignments')
        .insert({
          item_id: itemId,
          member_id: effectiveMemberId,
        });

      if (insError) {
        console.error('[Supabase] Error al crear asignación:', insError);
      } else {
        isAssignedNow = true;
      }
    }
  } catch (err) {
    console.warn('[Supabase] Fallo al sincronizar toggle plato en Supabase:', err);
  }

  // Sincronizar también el almacén local si existe
  toggleLocalItemClaim(salaId, eventoId, itemId, memberId);
  const evento = getLocalEventoById(salaId, eventoId);
  const item = evento?.items.find((i) => i.id === itemId);

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  revalidatePath(`/sala/${salaId}`);
  revalidatePath('/');

  return {
    success: true,
    item: item || {
      id: itemId,
      name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      category: 'food',
      assignedMemberIds: isAssignedNow ? [memberId] : [],
    },
  };
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
  const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const qty = Math.max(1, platoData.quantity || 1);
  const uPrice = Number(platoData.unit_price || 0);
  const tPrice = Math.round(qty * uPrice * 100) / 100;

  // Asignar solo si el usuario seleccionó comensales explícitamente; por defecto queda vacío ([])
  const assigned = (platoData.assignedMemberIds && Array.isArray(platoData.assignedMemberIds))
    ? platoData.assignedMemberIds
    : [];

  const newItem: TicketItem = {
    id: itemId,
    name: platoData.name,
    quantity: qty,
    unit_price: uPrice,
    total_price: tPrice,
    category: platoData.category || 'food',
    assignedMemberIds: assigned,
  };

  try {
    const supabase = getSupabaseServer();
    const { error: itemError } = await supabase.from('ticket_items').insert({
      id: newItem.id,
      evento_id: eventoId,
      name: newItem.name,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      total_price: newItem.total_price,
      category: newItem.category,
    });

    if (itemError) {
      console.error('[Supabase] Error inserting ticket_item:', itemError);
    } else {
      if (assigned.length > 0) {
        const { data: validMembers } = await supabase
          .from('sala_members')
          .select('id')
          .eq('sala_id', salaId);
        const validIds = new Set((validMembers || []).map((m) => m.id));

        const assignmentsToInsert = assigned
          .filter((mId) => validIds.has(mId))
          .map((mId) => ({
            item_id: newItem.id,
            member_id: mId,
          }));

        if (assignmentsToInsert.length > 0) {
          const { error: assignError } = await supabase
            .from('ticket_item_assignments')
            .insert(assignmentsToInsert);
          if (assignError) console.error('[Supabase] Error inserting assignments:', assignError);
        }
      }

      // Actualizar total_amount del evento
      const { data: allItems } = await supabase
        .from('ticket_items')
        .select('total_price')
        .eq('evento_id', eventoId);
      if (allItems) {
        const sum = allItems.reduce((acc, curr) => acc + Number(curr.total_price || 0), 0);
        await supabase.from('eventos').update({ total_amount: Math.round(sum * 100) / 100 }).eq('id', eventoId);
      }
    }
  } catch (err) {
    console.warn('[Supabase] Fallo al insertar plato en Supabase:', err);
  }

  // Sincronizar en tienda local si existe
  addLocalItemToEvento(salaId, eventoId, platoData);

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  revalidatePath(`/sala/${salaId}`);
  revalidatePath('/');
  return { success: true, item: newItem };
}

export async function anadirPlatosDesdeTicketAction(
  salaId: string,
  eventoId: string,
  platos: Omit<TicketItem, 'id'>[]
): Promise<{ success: boolean; addedCount: number; items: TicketItem[] }> {
  if (!platos || platos.length === 0) {
    return { success: false, addedCount: 0, items: [] };
  }

  const createdItems: TicketItem[] = [];

  try {
    const supabase = getSupabaseServer();

    const { data: validMembers } = await supabase
      .from('sala_members')
      .select('id')
      .eq('sala_id', salaId);
    const validIds = new Set((validMembers || []).map((m) => m.id));

    for (const plato of platos) {
      const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const qty = Math.max(1, plato.quantity || 1);
      const uPrice = Number(plato.unit_price || 0);
      const tPrice = Math.round(qty * uPrice * 100) / 100;

      // Respetar comensales explícitos o dejar vacío sin asignar a nadie por defecto ([])
      const assigned = (plato.assignedMemberIds && Array.isArray(plato.assignedMemberIds))
        ? plato.assignedMemberIds
        : [];

      const newItem: TicketItem = {
        id: itemId,
        name: plato.name,
        quantity: qty,
        unit_price: uPrice,
        total_price: tPrice,
        category: plato.category || 'food',
        assignedMemberIds: assigned,
      };

      createdItems.push(newItem);

      const { error: itemError } = await supabase.from('ticket_items').insert({
        id: newItem.id,
        evento_id: eventoId,
        name: newItem.name,
        quantity: newItem.quantity,
        unit_price: newItem.unit_price,
        total_price: newItem.total_price,
        category: newItem.category,
      });

      if (itemError) {
        console.error('[Supabase] Error inserting item from ticket:', itemError);
      } else {
        const assignmentsToInsert = assigned
          .filter((mId) => validIds.has(mId))
          .map((mId) => ({
            item_id: newItem.id,
            member_id: mId,
          }));

        if (assignmentsToInsert.length > 0) {
          await supabase.from('ticket_item_assignments').insert(assignmentsToInsert);
        }
      }
    }

    // Actualizar total_amount del evento
    const { data: allItems } = await supabase
      .from('ticket_items')
      .select('total_price')
      .eq('evento_id', eventoId);
    if (allItems) {
      const sum = allItems.reduce((acc, curr) => acc + Number(curr.total_price || 0), 0);
      await supabase.from('eventos').update({ total_amount: Math.round(sum * 100) / 100 }).eq('id', eventoId);
    }
  } catch (err) {
    console.warn('[Supabase] Fallo al insertar platos múltiples en Supabase:', err);
  }

  // Sincronizar en tienda local
  addLocalMultipleItemsToEvento(salaId, eventoId, platos);

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  revalidatePath(`/sala/${salaId}`);
  revalidatePath('/');

  return { success: createdItems.length > 0, addedCount: createdItems.length, items: createdItems };
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
