import { Sala, UserGlobalWallet, RoomBalanceCalculation } from './types';

// Solo mantenemos la constante por defecto si alguien la usa temporalmente
export const CURRENT_USER_ID = 'user-carlos';

/**
 * Operative Room Balance Calculation Formula:
 * B_s = \sum P_{adv} - \sum C_{pers} + \sum T_{rec} - \sum T_{env}
 * Con principio de conservación: \sum_{m} B_s(m) = 0.00 €
 */
export function calculateRoomBalance(salaOrId: string | Sala, memberId: string): RoomBalanceCalculation {
  // If a string is passed, we can't look it up anymore since the mock store is gone.
  // We expect the full Sala object to be passed.
  if (typeof salaOrId === 'string') {
    return { memberId, pAdv: 0, cPers: 0, tRec: 0, tEnv: 0, netBalance: 0 };
  }
  
  const sala = salaOrId;
  if (!sala) {
    return { memberId, pAdv: 0, cPers: 0, tRec: 0, tEnv: 0, netBalance: 0 };
  }

  // Resolver ID efectivo de Carlos/usuario para compatibilidad Supabase ('m1') vs local ('user-carlos')
  const effectiveMember = sala.members.find(
    (m) =>
      m.id === memberId ||
      (memberId.toLowerCase().includes('carlos') &&
        (m.id === 'm1' || m.id === 'user-carlos' || m.id === 'user_carlos_1' || m.name.toLowerCase().includes('carlos')))
  );
  const targetId = effectiveMember ? effectiveMember.id : memberId;

  let pAdv = 0;
  let cPers = 0;
  let tRec = 0;
  let tEnv = 0;

  for (const evento of sala.eventos || []) {
    // 1. Pagos adelantados (si el usuario fue el pagador de la cuenta)
    if (evento.originalPayerId === targetId) {
      pAdv += Number(evento.totalAmount || 0);
    }

    // 2. Consumo personal en los platos asignados
    const activeMemberCount = (sala.members || []).length;
    for (const item of evento.items || []) {
      const assigned = item.assignedMemberIds || [];
      if (assigned.includes(targetId) || (targetId === 'm1' && assigned.includes('user-carlos')) || (targetId === 'user-carlos' && assigned.includes('m1'))) {
        const count = assigned.length || 1;
        cPers += Number(item.total_price || 0) / count;
      }
    }

    // Costes comunes
    for (const cc of evento.commonCosts || []) {
      cPers += Number(cc.amount || 0) / (activeMemberCount || 1);
    }

    // 3. Bizums o transferencias de liquidación consolidadas
    for (const tx of evento.transactions || []) {
      if (tx.status === 'consolidado') {
        if (tx.toMemberId === targetId) {
          tRec += Number(tx.amount || 0);
        }
        if (tx.fromMemberId === targetId) {
          tEnv += Number(tx.amount || 0);
        }
      }
    }
  }

  pAdv = Math.round(pAdv * 100) / 100;
  cPers = Math.round(cPers * 100) / 100;
  tRec = Math.round(tRec * 100) / 100;
  tEnv = Math.round(tEnv * 100) / 100;
  const netBalance = Math.round((pAdv - cPers + tRec - tEnv) * 100) / 100;

  return { memberId: targetId, pAdv, cPers, tRec, tEnv, netBalance };
}

/**
 * Informative Global Wallet Calculation:
 * Applies Non-Compensation Principle across independent rooms:
 * Total por cobrar = \sum \max(0, B_s)
 * Total por pagar = \sum |\min(0, B_s)|
 * Net Balance Total = Total por cobrar - Total por pagar
 */
export function calculateUserGlobalWallet(userId: string = CURRENT_USER_ID, customSalas: Sala[] = []): UserGlobalWallet {
  const salas = customSalas;
  let totalPorCobrar = 0;
  let totalPorPagar = 0;

  for (const sala of salas) {
    const member = sala.members.find(
      (m) =>
        m.id === userId ||
        (userId.toLowerCase().includes('carlos') &&
          (m.id === 'm1' || m.id === 'user-carlos' || m.id === 'user_carlos_1' || m.name.toLowerCase().includes('carlos')))
    );

    if (member) {
      const calc = calculateRoomBalance(sala, member.id);
      if (calc.netBalance > 0) {
        totalPorCobrar += calc.netBalance;
      } else if (calc.netBalance < 0) {
        totalPorPagar += Math.abs(calc.netBalance);
      }
    }
  }

  totalPorCobrar = Math.round(totalPorCobrar * 100) / 100;
  totalPorPagar = Math.round(totalPorPagar * 100) / 100;
  const netBalanceTotal = Math.round((totalPorCobrar - totalPorPagar) * 100) / 100;

  return {
    userId,
    userName: 'Usuario',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    totalPorCobrar,
    totalPorPagar,
    netBalanceTotal,
  };
}
