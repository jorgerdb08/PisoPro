import { FLATMATES } from "@/lib/constants";

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
    const cat = (expense.category || "other").toLowerCase();
    if (cat === "settlement" || cat === "payment_claim" || cat === "rent_payment") {
      return;
    }
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

// ==============================================================================
// CÁLCULOS MENSUALES, DESGLOSE INDIVIDUAL (600€ ALQUILER + VARIABLES) E HISTÓRICO
// ==============================================================================

export interface FlatmateMonthlyShare {
  userId: string;
  userName: "Jorge" | "Samuel" | "David";
  rentAmount: number; // 200 € fijo
  suppliesShare: number; // Luz + Agua + Gas + Internet
  variableShare: number; // Compras + Cenas + Otros
  totalToPay: number; // rentAmount + suppliesShare + variableShare
  totalAdvanced: number; // Lo que ha pagado de facturas/gastos en el mes
  netMonthBalance: number; // totalAdvanced - totalToPay (positivo = a favor, negativo = debe)
}

export interface MonthHistoryItem {
  monthStr: string; // "2026-09"
  displayName: string; // "Septiembre 2026"
  rentTotal: number; // 600 €
  suppliesTotal: number; // Luz, Agua, Gas, Internet
  variableTotal: number; // Compras, Cenas, etc.
  grandTotal: number; // rentTotal + suppliesTotal + variableTotal
  categoryBreakdown: Record<string, number>;
  expensesCount: number;
}

export function getExpenseMonth(dateStr: string): string {
  try {
    return dateStr.substring(0, 7); // YYYY-MM
  } catch {
    return new Date().toISOString().substring(0, 7);
  }
}

/**
 * Calcula las cuotas individuales de cada compañero para un mes específico:
 * - Alquiler fijo: 200 € cada uno (Total piso: 600 €)
 * - Suministros (Luz, Agua, Gas, Internet): Repartidos equitativamente
 * - Compras y Cenas: Según participación
 */
export function calculateMonthlyUserShares(
  expenses: ExpenseItem[],
  monthStr: string
): {
  shares: FlatmateMonthlyShare[];
  monthTotalSpend: number;
  monthSuppliesTotal: number;
  monthVariableTotal: number;
} {
  const monthExpenses = expenses.filter((e) => getExpenseMonth(e.date) === monthStr);

  const suppliesCategories = new Set([
    "luz",
    "utilities",
    "agua",
    "water",
    "gas",
    "internet",
    "wifi",
  ]);

  let monthSuppliesTotal = 0;
  let monthVariableTotal = 0;

  const suppliesPerUser: Record<string, number> = {
    [FLATMATES[0]!.id]: 0,
    [FLATMATES[1]!.id]: 0,
    [FLATMATES[2]!.id]: 0,
  };

  const variablePerUser: Record<string, number> = {
    [FLATMATES[0]!.id]: 0,
    [FLATMATES[1]!.id]: 0,
    [FLATMATES[2]!.id]: 0,
  };

  const advancedPerUser: Record<string, number> = {
    [FLATMATES[0]!.id]: 0,
    [FLATMATES[1]!.id]: 0,
    [FLATMATES[2]!.id]: 0,
  };

  monthExpenses.forEach((exp) => {
    const cat = (exp.category || "other").toLowerCase();
    if (cat === "settlement" || cat === "payment_claim" || cat === "rent_payment") {
      return;
    }
    const isSupplies = suppliesCategories.has(cat);
    const amount = Number(exp.amount) || 0;

    if (isSupplies) {
      monthSuppliesTotal += amount;
    } else if (cat !== "alquiler") {
      monthVariableTotal += amount;
    }

    // Quien adelantó el dinero
    if (advancedPerUser[exp.paid_by] !== undefined) {
      advancedPerUser[exp.paid_by] = (advancedPerUser[exp.paid_by] || 0) + amount;
    }

    // Desglose de cuotas por participante
    exp.participants.forEach((p) => {
      const share = Number(p.share_amount) || 0;
      if (isSupplies) {
        suppliesPerUser[p.user_id] = (suppliesPerUser[p.user_id] || 0) + share;
      } else if (cat !== "alquiler") {
        variablePerUser[p.user_id] = (variablePerUser[p.user_id] || 0) + share;
      }
    });
  });

  const shares: FlatmateMonthlyShare[] = FLATMATES.map((f) => {
    const sup = Math.round(((suppliesPerUser[f.id] || 0) + Number.EPSILON) * 100) / 100;
    const varShare = Math.round(((variablePerUser[f.id] || 0) + Number.EPSILON) * 100) / 100;
    const totalToPay = Math.round((200 + sup + varShare + Number.EPSILON) * 100) / 100;
    const advanced = Math.round(((advancedPerUser[f.id] || 0) + Number.EPSILON) * 100) / 100;
    const net = Math.round((advanced - totalToPay + Number.EPSILON) * 100) / 100;

    return {
      userId: f.id,
      userName: f.name,
      rentAmount: 200,
      suppliesShare: sup,
      variableShare: varShare,
      totalToPay,
      totalAdvanced: advanced,
      netMonthBalance: net,
    };
  });

  const monthTotalSpend = Math.round((600 + monthSuppliesTotal + monthVariableTotal + Number.EPSILON) * 100) / 100;

  return {
    shares,
    monthTotalSpend,
    monthSuppliesTotal: Math.round((monthSuppliesTotal + Number.EPSILON) * 100) / 100,
    monthVariableTotal: Math.round((monthVariableTotal + Number.EPSILON) * 100) / 100,
  };
}

/**
 * Genera el histórico mensual comparativo (últimos N meses)
 */
export function getMonthlyHistoricalBreakdown(
  expenses: ExpenseItem[],
  monthsCount: number = 6
): MonthHistoryItem[] {
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Identificar los últimos N meses a partir del mes actual
  const now = new Date();
  const months: string[] = [];

  for (let i = 0; i < monthsCount; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
  }

  // Agrupar gastos por mes
  return months.map((monthStr) => {
    const [year, month] = monthStr.split("-").map(Number);
    const displayName = `${monthNames[(month || 1) - 1]!} ${year}`;

    const monthExpenses = expenses.filter((e) => getExpenseMonth(e.date) === monthStr);
    const categoryBreakdown: Record<string, number> = {
      alquiler: 600,
    };

    let suppliesTotal = 0;
    let variableTotal = 0;

    const suppliesCats = new Set(["luz", "utilities", "agua", "water", "gas", "internet", "wifi"]);

    monthExpenses.forEach((e) => {
      const cat = (e.category || "otros").toLowerCase();
      if (cat === "settlement" || cat === "payment_claim" || cat === "rent_payment") {
        return;
      }
      const amount = Number(e.amount) || 0;
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amount;

      if (suppliesCats.has(cat)) {
        suppliesTotal += amount;
      } else if (cat !== "alquiler") {
        variableTotal += amount;
      }
    });

    const grandTotal = Math.round((600 + suppliesTotal + variableTotal + Number.EPSILON) * 100) / 100;

    return {
      monthStr,
      displayName,
      rentTotal: 600,
      suppliesTotal: Math.round((suppliesTotal + Number.EPSILON) * 100) / 100,
      variableTotal: Math.round((variableTotal + Number.EPSILON) * 100) / 100,
      grandTotal,
      categoryBreakdown,
      expensesCount: monthExpenses.length,
    };
  });
}

