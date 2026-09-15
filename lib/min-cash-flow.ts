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
