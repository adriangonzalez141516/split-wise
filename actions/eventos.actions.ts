'use server';

import { revalidatePath } from 'next/cache';
import {
  getEventoById,
  getSalaById,
  toggleItemClaim,
  excludeAlcoholForMember,
  addItemToEvento,
  addMultipleItemsToEvento,
  CURRENT_USER_ID,
} from '@/lib/store';
import { Evento, TicketItem } from '@/lib/types';
import { calculateMinCashFlow, identifySuggestedPayer } from '@/lib/min-cash-flow';

export async function getEventoDetailAction(salaId: string, eventoId: string): Promise<Evento | null> {
  const evento = getEventoById(salaId, eventoId);
  return evento || null;
}

export async function togglePlatoClaimAction(
  salaId: string,
  eventoId: string,
  itemId: string,
  memberId: string = CURRENT_USER_ID
): Promise<{ success: boolean; item?: TicketItem }> {
  const success = toggleItemClaim(salaId, eventoId, itemId, memberId);
  const evento = getEventoById(salaId, eventoId);
  const item = evento?.items.find((i) => i.id === itemId);

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  return { success, item };
}

export async function excluirAlcoholAction(
  salaId: string,
  eventoId: string,
  memberId: string = CURRENT_USER_ID,
  exclude: boolean = true
): Promise<{ success: boolean }> {
  excludeAlcoholForMember(salaId, eventoId, memberId, exclude);
  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  return { success: true };
}

export async function repartirCostesComunesAction(
  salaId: string,
  eventoId: string,
  splitType: 'equitativo' | 'proporcional'
): Promise<{ success: boolean }> {
  const evento = getEventoById(salaId, eventoId);
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
  const sala = getSalaById(salaId);
  const evento = getEventoById(salaId, eventoId);
  if (!sala || !evento) return { success: false, message: 'Evento no encontrado' };

  // Calculate member net consumption
  const activeMembers = sala.members;
  const balances: { memberId: string; netBalance: number }[] = [];

  for (const member of activeMembers) {
    let consumption = 0;

    // Item consumption
    for (const item of evento.items) {
      if (item.assignedMemberIds.includes(member.id)) {
        consumption += item.total_price / (item.assignedMemberIds.length || 1);
      }
    }

    // Common costs
    for (const cc of evento.commonCosts) {
      consumption += cc.amount / (activeMembers.length || 1);
    }

    // Advance payment
    const isPayer = evento.originalPayerId === member.id;
    const advance = isPayer ? evento.totalAmount : 0;

    const net = advance - consumption;
    balances.push({ memberId: member.id, netBalance: Math.round(net * 100) / 100 });
  }

  // Generate Min-Cash-Flow transactions
  const optimizedTx = calculateMinCashFlow(balances, evento.originalPayerId);
  evento.transactions = optimizedTx;
  evento.suggestedPayerId = identifySuggestedPayer(balances);

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  return { success: true, message: 'Evento consolidado con optimización Min-Cash-Flow' };
}

export async function anadirPlatoAction(
  salaId: string,
  eventoId: string,
  platoData: Omit<TicketItem, 'id'>
): Promise<{ success: boolean; item?: TicketItem }> {
  const item = addItemToEvento(salaId, eventoId, platoData);
  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  revalidatePath(`/sala/${salaId}`);
  return { success: !!item, item };
}

export async function anadirPlatosDesdeTicketAction(
  salaId: string,
  eventoId: string,
  platos: Omit<TicketItem, 'id'>[]
): Promise<{ success: boolean; addedCount: number; items: TicketItem[] }> {
  const items = addMultipleItemsToEvento(salaId, eventoId, platos);
  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  revalidatePath(`/sala/${salaId}`);
  return { success: items.length > 0, addedCount: items.length, items };
}
