import { LiquidacionTransaction } from './types';

export interface MemberBalance {
  memberId: string;
  netBalance: number; // Positive: creditor (te deben), Negative: debtor (debes)
}

/**
 * Min-Cash-Flow algorithm with exact zero-sum cents imputation.
 * Minimizes total number of transactions to clear all debts.
 * Residual fractional cents are systematically imputed to the original payer
 * to ensure that sum(balances) is precisely 0.00 €.
 */
export function calculateMinCashFlow(
  balances: MemberBalance[],
  originalPayerId?: string
): LiquidacionTransaction[] {
  // 1. Clone balances and round to 2 decimals
  const workingBalances: Record<string, number> = {};
  let totalSum = 0;

  balances.forEach((b) => {
    const rounded = Math.round(b.netBalance * 100) / 100;
    workingBalances[b.memberId] = rounded;
    totalSum += rounded;
  });

  // Impute residual cents to original payer if sum !== 0
  const discrepancy = Math.round(totalSum * 100) / 100;
  if (Math.abs(discrepancy) > 0.0001 && originalPayerId && workingBalances[originalPayerId] !== undefined) {
    workingBalances[originalPayerId] = Math.round((workingBalances[originalPayerId] - discrepancy) * 100) / 100;
  }

  // 2. Separate into Creditors (+) and Debtors (-)
  const creditors: { memberId: string; amount: number }[] = [];
  const debtors: { memberId: string; amount: number }[] = [];

  Object.entries(workingBalances).forEach(([memberId, balance]) => {
    if (balance > 0.005) {
      creditors.push({ memberId, amount: balance });
    } else if (balance < -0.005) {
      debtors.push({ memberId, amount: Math.abs(balance) });
    }
  });

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: LiquidacionTransaction[] = [];
  let cIdx = 0;
  let dIdx = 0;
  const now = new Date().toISOString();

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const amount = Math.min(creditor.amount, debtor.amount);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0) {
      transactions.push({
        id: `tx-${Date.now()}-${transactions.length + 1}`,
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amount: roundedAmount,
        status: 'propuesta',
        suggestedAt: now,
        updatedAt: now,
        note: 'Optimizado vía Min-Cash-Flow',
        ruleApplied: 'regla_4_min_cash_flow',
      });
    }

    creditor.amount = Math.round((creditor.amount - amount) * 100) / 100;
    debtor.amount = Math.round((debtor.amount - amount) * 100) / 100;

    if (creditor.amount <= 0.005) {
      cIdx++;
    }
    if (debtor.amount <= 0.005) {
      dIdx++;
    }
  }

  return transactions;
}

/**
 * Regla 1: Pagador Sugerido.
 * Suggests the attendee with the most negative room balance to pay the restaurant bill.
 */
export function identifySuggestedPayer(roomBalances: MemberBalance[]): string | undefined {
  if (!roomBalances || roomBalances.length === 0) return undefined;
  let minBalance = 0;
  let suggestedMemberId: string | undefined = undefined;

  for (const b of roomBalances) {
    if (b.netBalance < minBalance) {
      minBalance = b.netBalance;
      suggestedMemberId = b.memberId;
    }
  }

  return suggestedMemberId;
}

export interface CascadeRequestItem {
  debtorId: string;
  name: string;
  phone?: string;
  amount: number;
}

/**
 * Regla 2: Petición en Cascada ("Solicitar que se pongan al día conmigo").
 * Un acreedor (saldo > 0) solicita cobrar su saldo.
 * Se le reclama primero al deudor con mayor saldo negativo.
 * Si su deuda no cubre el total adeudado, absorbe el 100% de ese deudor y
 * pasa en cascada al 2º, 3º deudor etc. hasta cubrir la totalidad.
 */
export function calculateCascadeRequest(
  creditorId: string,
  balances: { memberId: string; name: string; phone?: string; netBalance: number }[]
): { totalToCollect: number; requests: CascadeRequestItem[] } {
  const creditor = balances.find((b) => b.memberId === creditorId);
  const totalToCollect = creditor && creditor.netBalance > 0 ? Math.round(creditor.netBalance * 100) / 100 : 0;
  if (totalToCollect <= 0) return { totalToCollect: 0, requests: [] };

  // Deudores ordenados por mayor deuda (más negativo a menos)
  const debtors = balances
    .filter((b) => b.memberId !== creditorId && b.netBalance < -0.005)
    .map((b) => ({
      memberId: b.memberId,
      name: b.name,
      phone: b.phone,
      debt: Math.round(Math.abs(b.netBalance) * 100) / 100,
    }))
    .sort((a, b) => b.debt - a.debt);

  let remaining = totalToCollect;
  const requests: CascadeRequestItem[] = [];

  for (const d of debtors) {
    if (remaining <= 0.005) break;
    const take = Math.min(remaining, d.debt);
    const roundedTake = Math.round(take * 100) / 100;
    if (roundedTake > 0) {
      requests.push({
        debtorId: d.memberId,
        name: d.name,
        phone: d.phone,
        amount: roundedTake,
      });
      remaining = Math.round((remaining - roundedTake) * 100) / 100;
    }
  }

  return { totalToCollect, requests };
}

export interface CascadePaymentItem {
  creditorId: string;
  name: string;
  phone?: string;
  amount: number;
}

/**
 * Regla 3: Puesta al Día en Cascada ("Ponerme al día").
 * Un deudor (saldo < 0) quiere saldar su deuda.
 * El sistema le asigna el pago al mayor acreedor (a quien más dinero se le deba).
 * Si la deuda del pagador supera el crédito de este primer acreedor,
 * se cubre el 100% de ese acreedor y el excedente va en cascada al 2º, 3º acreedor etc.
 */
export function calculateCascadePayment(
  debtorId: string,
  balances: { memberId: string; name: string; phone?: string; netBalance: number }[]
): { totalToPay: number; payments: CascadePaymentItem[] } {
  const debtor = balances.find((b) => b.memberId === debtorId);
  const totalToPay = debtor && debtor.netBalance < -0.005 ? Math.round(Math.abs(debtor.netBalance) * 100) / 100 : 0;
  if (totalToPay <= 0) return { totalToPay: 0, payments: [] };

  // Acreedores ordenados por mayor crédito (a quien más se le debe)
  const creditors = balances
    .filter((b) => b.memberId !== debtorId && b.netBalance > 0.005)
    .map((b) => ({
      memberId: b.memberId,
      name: b.name,
      phone: b.phone,
      credit: Math.round(b.netBalance * 100) / 100,
    }))
    .sort((a, b) => b.credit - a.credit);

  let remaining = totalToPay;
  const payments: CascadePaymentItem[] = [];

  for (const c of creditors) {
    if (remaining <= 0.005) break;
    const pay = Math.min(remaining, c.credit);
    const roundedPay = Math.round(pay * 100) / 100;
    if (roundedPay > 0) {
      payments.push({
        creditorId: c.memberId,
        name: c.name,
        phone: c.phone,
        amount: roundedPay,
      });
      remaining = Math.round((remaining - roundedPay) * 100) / 100;
    }
  }

  return { totalToPay, payments };
}
