'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServer } from '@/lib/supabase/server';
import { calculateUserGlobalWallet, calculateRoomBalance } from '@/lib/store';
import { getCurrentUserAction } from '@/actions/user.actions';
import { UserGlobalWallet, RoomBalanceCalculation, LiquidacionTransaction } from '@/lib/types';
import { calculateMinCashFlow, identifySuggestedPayer } from '@/lib/min-cash-flow';

import { getSalasAction, getSalaDetailAction } from './salas.actions';

export async function getMonederoGlobalAction(userId?: string): Promise<UserGlobalWallet> {
  let effectiveUserId = userId;
  if (!effectiveUserId) {
    const currentUser = await getCurrentUserAction();
    effectiveUserId = currentUser ? currentUser.id : 'm1';
  }
  const salas = await getSalasAction();
  return calculateUserGlobalWallet(effectiveUserId, salas);
}

export async function getBalancesSalaAction(salaId: string): Promise<RoomBalanceCalculation[]> {
  const sala = await getSalaDetailAction(salaId);
  if (!sala) return [];

  return sala.members.map((m) => calculateRoomBalance(sala, m.id));
}

export async function actualizarEstadoBizumAction(
  salaId: string,
  eventoId: string,
  txId: string,
  newStatus: 'propuesta' | 'pendiente' | 'consolidado'
): Promise<{ success: boolean; newStatus: string }> {
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('liquidaciones')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', txId);

  if (error) {
    console.error('[Supabase] Error actualizando liquidacion:', error);
    throw new Error('Fallo al actualizar el estado de la liquidación en el servidor');
  }

  revalidatePath(`/sala/${salaId}/evento/${eventoId}`);
  revalidatePath(`/sala/${salaId}`);
  revalidatePath('/');
  return { success: true, newStatus };
}

export async function ejecutarMinCashFlowSalaAction(
  salaId: string
): Promise<{ transactions: LiquidacionTransaction[]; suggestedPayerId?: string }> {
  const sala = await getSalaDetailAction(salaId);
  if (!sala) return { transactions: [] };

  const balances = sala.members.map((m) => {
    const calc = calculateRoomBalance(sala, m.id);
    return { memberId: m.id, netBalance: calc.netBalance };
  });

  const suggestedPayerId = identifySuggestedPayer(balances);
  const transactions = calculateMinCashFlow(balances);

  if (transactions.length > 0) {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.from('liquidaciones').upsert(
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

    if (error) {
      console.error('[Supabase] Error guardando transacciones de Min-Cash-Flow:', error);
      throw new Error('No se pudo guardar la propuesta de liquidación');
    }
  }

  return { transactions, suggestedPayerId };
}
