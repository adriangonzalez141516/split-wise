'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServer } from '@/lib/supabase/server';
import {
  calculateUserGlobalWallet,
  calculateRoomBalance,
  getSalaById,
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

  try {
    const supabase = getSupabaseServer();
    await supabase
      .from('liquidaciones')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', txId);
  } catch (err) {
    console.warn('[Supabase] Fallo al actualizar liquidación en Supabase:', err);
  }

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

  try {
    const supabase = getSupabaseServer();
    if (transactions.length > 0) {
      await supabase.from('liquidaciones').upsert(
        transactions.map((tx) => ({
          id: tx.id,
          sala_id: salaId,
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
    console.warn('[Supabase] Fallo al guardar transacciones de Min-Cash-Flow en Supabase:', err);
  }

  return { transactions, suggestedPayerId };
}
