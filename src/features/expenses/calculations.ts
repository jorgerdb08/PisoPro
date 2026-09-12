export interface ExpenseParticipantItem {
  user_id: string;
  share_amount: number;
}

export interface ExpenseItem {
  id: string;
  household_id: string;
  description: string;
  amount: number;
  paid_by: string;
  date: string;
  category?: string;
  notes?: string;
  created_at?: string;
  participants: ExpenseParticipantItem[];
}

export interface DebtTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface UserBalanceSummary {
  userId: string;
  netBalance: number; // > 0 te deben, < 0 debes
  totalOwedByMe: number; // lo que tengo que pagar
  totalOwedToMe: number; // lo que tienen que pagarme
}

/**
 * Calcula el saldo neto de cada compañero:
 * Saldo = Total pagado por el usuario - Total consumido en sus cuotas
 */
export function calculateNetBalances(
  expenses: ExpenseItem[],
  flatmateIds: string[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Inicializar a 0 para todos los miembros
  flatmateIds.forEach((id) => {
    balances[id] = 0;
  });

  expenses.forEach((expense) => {
    const amount = Number(expense.amount) || 0;

    // Quien pagó suma el importe total
    if (balances[expense.paid_by] !== undefined) {
      balances[expense.paid_by] = (balances[expense.paid_by] || 0) + amount;
    } else {
      balances[expense.paid_by] = amount;
    }

    // Cada participante resta su cuota de consumo
    expense.participants.forEach((p) => {
      const share = Number(p.share_amount) || 0;
      if (balances[p.user_id] !== undefined) {
        balances[p.user_id] = (balances[p.user_id] || 0) - share;
      } else {
        balances[p.user_id] = -share;
      }
    });
  });

  // Redondear a 2 decimales para evitar problemas de precisión flotante IEEE 754
  const rounded: Record<string, number> = {};
  Object.keys(balances).forEach((id) => {
    const val = balances[id] || 0;
    rounded[id] = Math.round((val + Number.EPSILON) * 100) / 100;
  });

  return rounded;
}

/**
 * Algoritmo Greedy de minimización de transferencias:
 * Empareja sucesivamente al mayor deudor con el mayor acreedor,
 * resolviendo todas las deudas con el número mínimo de pagos.
 */
export function minimizeDebts(netBalances: Record<string, number>): DebtTransfer[] {
  interface Account {
    userId: string;
    amount: number;
  }

  const debtors: Account[] = [];
  const creditors: Account[] = [];

  Object.entries(netBalances).forEach(([userId, balance]) => {
    const rounded = Math.round((balance + Number.EPSILON) * 100) / 100;
    if (rounded < -0.01) {
      debtors.push({ userId, amount: Math.abs(rounded) });
    } else if (rounded > 0.01) {
      creditors.push({ userId, amount: rounded });
    }
  });

  const transfers: DebtTransfer[] = [];

  while (debtors.length > 0 && creditors.length > 0) {
    // Ordenar de mayor a menor saldo para emparejamiento óptimo
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const debtor = debtors[0]!;
    const creditor = creditors[0]!;

    const transferAmount = Math.min(debtor.amount, creditor.amount);
    const roundedTransfer = Math.round((transferAmount + Number.EPSILON) * 100) / 100;

    if (roundedTransfer > 0) {
      transfers.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: roundedTransfer,
      });

      debtor.amount = Math.round((debtor.amount - roundedTransfer + Number.EPSILON) * 100) / 100;
      creditor.amount = Math.round((creditor.amount - roundedTransfer + Number.EPSILON) * 100) / 100;
    }

    if (debtor.amount <= 0.01) {
      debtors.shift();
    }
    if (creditor.amount <= 0.01) {
      creditors.shift();
    }
  }

  return transfers;
}

/**
 * Calcula el resumen de balance para un usuario concreto
 */
export function getUserBalanceSummary(
  userId: string,
  netBalances: Record<string, number>,
  transfers: DebtTransfer[]
): UserBalanceSummary {
  const netBalance = netBalances[userId] || 0;

  const totalOwedByMe = transfers
    .filter((t) => t.fromUserId === userId)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOwedToMe = transfers
    .filter((t) => t.toUserId === userId)
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    userId,
    netBalance: Math.round((netBalance + Number.EPSILON) * 100) / 100,
    totalOwedByMe: Math.round((totalOwedByMe + Number.EPSILON) * 100) / 100,
    totalOwedToMe: Math.round((totalOwedToMe + Number.EPSILON) * 100) / 100,
  };
}
