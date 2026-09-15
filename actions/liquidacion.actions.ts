'use server';

import { revalidatePath } from 'next/cache';
import {
  calculateUserGlobalWallet,
  calculateRoomBalance,
  getSalaById,
  getEventoById,
  updateTransactionStatus,
  CURRENT_USER_ID,
} from '@/lib/store';
import { UserGlobalWallet, RoomBalanceCalculation, LiquidacionTransaction } from '@/lib/types';
import { calculateMinCashFlow, identifySuggestedPayer } from '@/lib/min-cash-flow';

export async function getMonederoGlobalAction(userId: string = CURRENT_USER_ID): Promise<UserGlobalWallet> {
  return calculateUserGlobalWallet(userId);
}

export async function getBalancesSalaAction(salaId: string): Promise<RoomBalanceCalculation[]> {
  const sala = getSalaById(salaId);
  if (!sala) return [];

  return sala.members.map((m) => calculateRoomBalance(salaId, m.id));
}

export async function actualizarEstadoBizumAction(
  salaId: string,
  eventoId: string,
  txId: string,
  newStatus: 'propuesta' | 'pendiente' | 'consolidado'
): Promise<{ success: boolean; newStatus: string }> {
  const success = updateTransactionStatus(salaId, eventoId, txId, newStatus);
  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  revalidatePath(`/sala/${salaId}`);
  revalidatePath('/');
  return { success, newStatus };
}

export async function ejecutarMinCashFlowSalaAction(
  salaId: string
): Promise<{ transactions: LiquidacionTransaction[]; suggestedPayerId?: string }> {
  const sala = getSalaById(salaId);
  if (!sala) return { transactions: [] };

  const balances = sala.members.map((m) => {
    const calc = calculateRoomBalance(salaId, m.id);
    return { memberId: m.id, netBalance: calc.netBalance };
  });

  const suggestedPayerId = identifySuggestedPayer(balances);
  const transactions = calculateMinCashFlow(balances);

  return { transactions, suggestedPayerId };
}
