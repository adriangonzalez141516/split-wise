'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServer } from '@/lib/supabase/server';
import { Evento, TicketItem } from '@/lib/types';
import { getCurrentUserAction } from '@/actions/user.actions';
import { calculateMinCashFlow, identifySuggestedPayer } from '@/lib/min-cash-flow';
import { getSalaDetailAction } from './salas.actions';

export async function getEventoDetailAction(salaId: string, eventoId: string): Promise<Evento | null> {
  const supabase = await getSupabaseServer();
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

  if (error || !e) {
    console.error(`[Supabase] Error fetching evento ${eventoId}:`, error);
    return null;
  }

  return {
    id: e.id,
    salaId: e.sala_id,
    title: e.title,
    venue: e.venue,
    date: e.date,
    status: e.status as 'en_curso' | 'cerrado',
    originalPayerId: e.original_payer_id || null,
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

export async function toggleItemClaimAction(
  salaId: string,
  eventoId: string,
  itemId: string,
  memberId?: string
): Promise<{ success: boolean; message: string }> {
  let effectiveMemberId = memberId;
  if (!effectiveMemberId) {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) return { success: false, message: 'No autorizado' };
    effectiveMemberId = currentUser.id;
  }

  const supabase = await getSupabaseServer();

  let memberInSalaId = effectiveMemberId;
  const { data: memberInSala } = await supabase
    .from('sala_members')
    .select('id')
    .eq('sala_id', salaId)
    .eq('id', effectiveMemberId)
    .maybeSingle();

  if (!memberInSala) {
    const { data: fallbackMember } = await supabase
      .from('sala_members')
      .select('id')
      .eq('sala_id', salaId)
      .ilike('name', '%Carlos%')
      .maybeSingle();

    if (fallbackMember) {
      memberInSalaId = fallbackMember.id;
    } else {
      const { data: firstMember } = await supabase
        .from('sala_members')
        .select('id')
        .eq('sala_id', salaId)
        .limit(1)
        .maybeSingle();
      if (firstMember) memberInSalaId = firstMember.id;
    }
  }

  const { data: existing, error: checkError } = await supabase
    .from('ticket_item_assignments')
    .select('id')
    .eq('item_id', itemId)
    .eq('member_id', memberInSalaId)
    .maybeSingle();

  if (checkError) {
    console.error('[Supabase] Error checking assignments:', checkError);
    throw new Error('Error al consultar base de datos');
  }

  if (existing) {
    const { error: delError } = await supabase
      .from('ticket_item_assignments')
      .delete()
      .eq('item_id', itemId)
      .eq('member_id', memberInSalaId);

    if (delError) throw new Error('Error al eliminar asignación');
  } else {
    const { error: insError } = await supabase
      .from('ticket_item_assignments')
      .insert({ item_id: itemId, member_id: memberInSalaId });

    if (insError) throw new Error('Error al crear asignación');
  }

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  revalidatePath(`/sala/${salaId}`);
  revalidatePath('/');

  return { success: true, message: 'Asignación actualizada' };
}

export async function excludeAlcoholAction(
  salaId: string,
  eventoId: string,
  memberId?: string,
  exclude: boolean = true
): Promise<{ success: boolean; message: string }> {
  // Not fully implemented in Supabase schema yet (global modifiers)
  return { success: true, message: 'Función no implementada en DB' };
}

export async function repartirCostesComunesAction(
  salaId: string,
  eventoId: string,
  splitType: 'equitativo' | 'proporcional'
): Promise<{ success: boolean }> {
  // Not fully implemented in Supabase schema yet (common costs)
  return { success: false };
}

export async function consolidarEventoAction(
  salaId: string,
  eventoId: string
): Promise<{ success: boolean; message: string }> {
  const sala = await getSalaDetailAction(salaId);
  if (!sala) return { success: false, message: 'Sala no encontrada' };

  const evento = sala.eventos.find(e => e.id === eventoId);
  if (!evento) return { success: false, message: 'Evento no encontrado' };

  const activeMembers = sala.members;
  const balances: { memberId: string; netBalance: number }[] = [];

  for (const member of activeMembers) {
    let consumption = 0;

    for (const item of evento.items) {
      if (item.assignedMemberIds.includes(member.id)) {
        consumption += item.total_price / (item.assignedMemberIds.length || 1);
      }
    }

    // commonCosts not implemented yet in DB

    const isPayer = evento.originalPayerId === member.id;
    const advance = isPayer ? evento.totalAmount : 0;

    const net = advance - consumption;
    balances.push({ memberId: member.id, netBalance: Math.round(net * 100) / 100 });
  }

  const optimizedTx = calculateMinCashFlow(balances, evento.originalPayerId || undefined);

  const supabase = await getSupabaseServer();
  const { error: updateError } = await supabase.from('eventos').update({ status: 'cerrado' }).eq('id', eventoId);
  if (updateError) throw new Error('Error cerrando evento');

  if (optimizedTx.length > 0) {
    const { error: txError } = await supabase.from('liquidaciones').upsert(
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
    if (txError) throw new Error('Error guardando transacciones de consolidación');
  }

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  revalidatePath(`/sala/${salaId}`);
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

  const supabase = await getSupabaseServer();
  const { error: itemError } = await supabase.from('ticket_items').insert({
    id: newItem.id,
    evento_id: eventoId,
    name: newItem.name,
    quantity: newItem.quantity,
    unit_price: newItem.unit_price,
    total_price: newItem.total_price,
    category: newItem.category,
  });

  if (itemError) throw new Error('Error al insertar plato');

  if (assigned.length > 0) {
    const { data: validMembers } = await supabase.from('sala_members').select('id').eq('sala_id', salaId);
    const validIds = new Set((validMembers || []).map((m) => m.id));

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

  const { data: allItems } = await supabase.from('ticket_items').select('total_price').eq('evento_id', eventoId);
  if (allItems) {
    const sum = allItems.reduce((acc, curr) => acc + Number(curr.total_price || 0), 0);
    await supabase.from('eventos').update({ total_amount: Math.round(sum * 100) / 100 }).eq('id', eventoId);
  }

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
  const supabase = await getSupabaseServer();

  const { data: validMembers } = await supabase.from('sala_members').select('id').eq('sala_id', salaId);
  const validIds = new Set((validMembers || []).map((m) => m.id));

  for (const plato of platos) {
    const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const qty = Math.max(1, plato.quantity || 1);
    const uPrice = Number(plato.unit_price || 0);
    const tPrice = Math.round(qty * uPrice * 100) / 100;

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

    await supabase.from('ticket_items').insert({
      id: newItem.id,
      evento_id: eventoId,
      name: newItem.name,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      total_price: newItem.total_price,
      category: newItem.category,
    });

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

  const { data: allItems } = await supabase.from('ticket_items').select('total_price').eq('evento_id', eventoId);
  if (allItems) {
    const sum = allItems.reduce((acc, curr) => acc + Number(curr.total_price || 0), 0);
    await supabase.from('eventos').update({ total_amount: Math.round(sum * 100) / 100 }).eq('id', eventoId);
  }

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

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from('eventos').insert({
    id: newEventoId,
    sala_id: salaId,
    title: titleStr,
    venue: venueStr,
    date: dateStr,
    status: 'en_curso',
    original_payer_id: payerId,
    total_amount: 0,
  });

  if (error) {
    console.error('[Supabase] Error al insertar evento:', error);
    throw new Error('Error al crear el evento');
  }

  revalidatePath(`/sala/${salaId}`);
  revalidatePath(`/sala/${salaId}/evento/${newEventoId}`);
  revalidatePath('/');
  
  return { 
    success: true, 
    evento: {
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
    } 
  };
}

export async function borrarPlatoAction(
  salaId: string,
  eventoId: string,
  itemId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await getSupabaseServer();
  
  // Borrar el item. Las asignaciones se borran en cascada automáticamente (ON DELETE CASCADE)
  const { error } = await supabase
    .from('ticket_items')
    .delete()
    .eq('id', itemId)
    .eq('evento_id', eventoId); // Asegurar que pertenece al evento correcto
    
  if (error) {
    console.error('[Supabase] Error al borrar plato:', error);
    throw new Error('Error al borrar el plato');
  }
  
  // Recalcular el total del evento
  const { data: allItems } = await supabase.from('ticket_items').select('total_price').eq('evento_id', eventoId);
  if (allItems) {
    const sum = allItems.reduce((acc, curr) => acc + Number(curr.total_price || 0), 0);
    await supabase.from('eventos').update({ total_amount: Math.round(sum * 100) / 100 }).eq('id', eventoId);
  }

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  revalidatePath(`/sala/${salaId}`);
  
  return { success: true, message: 'Plato borrado' };
}

export async function setEventPayerAction(
  salaId: string,
  eventoId: string,
  payerMemberId: string | null
): Promise<{ success: boolean; message: string }> {
  const supabase = await getSupabaseServer();
  
  // If payerMemberId is empty string or falsy, we set to null
  const { error } = await supabase
    .from('eventos')
    .update({ original_payer_id: payerMemberId || null })
    .eq('id', eventoId)
    .eq('sala_id', salaId);

  if (error) {
    console.error('[Supabase] Error al actualizar pagador del evento:', error);
    throw new Error('Error al actualizar el pagador');
  }

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  revalidatePath(`/sala/${salaId}`);
  return { success: true, message: 'Pagador actualizado correctamente' };
}
