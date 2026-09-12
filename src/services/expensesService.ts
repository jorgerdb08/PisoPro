import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_HOUSEHOLD_ID, FLATMATES } from "@/lib/constants";
import type { ExpenseItem, ExpenseParticipantItem } from "@/features/expenses/calculations";

interface DbTableClient<T> {
  select: (cols?: string) => {
    eq: (col: string, val: unknown) => {
      order: (
        col: string,
        opts?: { ascending?: boolean }
      ) => Promise<{ data: T[] | null; error: { message: string } | null }>;
    } & Promise<{ data: T[] | null; error: { message: string } | null }>;
    order: (
      col: string,
      opts?: { ascending?: boolean }
    ) => Promise<{ data: T[] | null; error: { message: string } | null }>;
    single: () => Promise<{ data: T | null; error: { message: string } | null }>;
  } & Promise<{ data: T[] | null; error: { message: string } | null }>;
  insert: (values: unknown) => {
    select: () => {
      single: () => Promise<{ data: T | null; error: { message: string } | null }>;
    };
  } & Promise<{ data: unknown; error: { message: string } | null }>;
  update: (values: unknown) => {
    eq: (
      col: string,
      val: unknown
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
  delete: () => {
    eq: (
      col: string,
      val: unknown
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
}

function getTableClient<T = unknown>(table: string): DbTableClient<T> {
  const supabase = getSupabaseBrowserClient();
  return (supabase.from as unknown as (t: string) => DbTableClient<T>)(table);
}

interface RawExpense {
  id: string;
  household_id: string;
  description: string;
  amount: number;
  paid_by: string;
  date: string;
  category?: string;
  notes?: string;
  created_at: string;
}

interface RawParticipant {
  id: string;
  expense_id: string;
  user_id: string;
  share_amount: number;
}

export const expensesService = {
  /**
   * Obtiene todos los gastos del piso junto con el desglose de participantes
   */
  async getExpenses(householdId: string = DEFAULT_HOUSEHOLD_ID): Promise<ExpenseItem[]> {
    const expensesTable = getTableClient<RawExpense>("expenses");
    const { data: rawExpenses, error: expError } = await expensesTable
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false });

    if (expError || !rawExpenses) {
      console.error("[expensesService] Error fetching expenses:", expError);
      return [];
    }

    const participantsTable = getTableClient<RawParticipant>("expense_participants");
    const { data: rawParticipants } = await participantsTable.select("*");

    const participantsByExpense: Record<string, ExpenseParticipantItem[]> = {};
    (rawParticipants || []).forEach((p) => {
      if (!participantsByExpense[p.expense_id]) {
        participantsByExpense[p.expense_id] = [];
      }
      participantsByExpense[p.expense_id]!.push({
        user_id: p.user_id,
        share_amount: Number(p.share_amount),
      });
    });

    return rawExpenses.map((e) => ({
      id: e.id,
      household_id: e.household_id,
      description: e.description,
      amount: Number(e.amount),
      paid_by: e.paid_by,
      date: e.date,
      category: e.category,
      notes: e.notes,
      created_at: e.created_at,
      participants: participantsByExpense[e.id] || [],
    }));
  },

  /**
   * Registra un nuevo gasto y distribuye las cuotas entre los participantes seleccionados
   */
  async createExpense(data: {
    household_id?: string;
    description: string;
    amount: number;
    paid_by: string;
    category?: string;
    notes?: string;
    date?: string;
    participantUserIds: string[];
  }): Promise<ExpenseItem | null> {
    const householdId = data.household_id || DEFAULT_HOUSEHOLD_ID;
    const date = data.date || new Date().toISOString().split("T")[0]!;

    const expensesTable = getTableClient<RawExpense>("expenses");
    const createdExpense = await expensesTable
      .insert({
        household_id: householdId,
        description: data.description,
        amount: data.amount,
        paid_by: data.paid_by,
        category: data.category || "other",
        notes: data.notes || null,
        date: date,
      })
      .select()
      .single();

    if (createdExpense.error || !createdExpense.data) {
      console.error("[expensesService] Error creating expense:", createdExpense.error);
      return null;
    }

    const expenseId = createdExpense.data.id;
    const participantsCount = data.participantUserIds.length;
    const share =
      participantsCount > 0
        ? Math.round((data.amount / participantsCount + Number.EPSILON) * 100) / 100
        : data.amount;

    const participantsTable = getTableClient("expense_participants");
    const participantsList: ExpenseParticipantItem[] = [];

    for (const userId of data.participantUserIds) {
      await participantsTable.insert({
        expense_id: expenseId,
        user_id: userId,
        share_amount: share,
      });
      participantsList.push({
        user_id: userId,
        share_amount: share,
      });
    }

    return {
      ...createdExpense.data,
      amount: Number(createdExpense.data.amount),
      participants: participantsList,
    };
  },

  /**
   * Registra un pago de liquidación para saldar una deuda
   */
  async settleDebt(
    fromUserId: string,
    toUserId: string,
    amount: number,
    householdId: string = DEFAULT_HOUSEHOLD_ID
  ): Promise<boolean> {
    const toFlatmate = FLATMATES.find((f) => f.id === toUserId);
    const desc = `Liquidación a ${toFlatmate?.name || "compañero"}`;

    const res = await this.createExpense({
      household_id: householdId,
      description: desc,
      amount: amount,
      paid_by: fromUserId,
      category: "settlement",
      notes: "Pago directo registrado para saldar cuentas",
      participantUserIds: [toUserId],
    });

    return res !== null;
  },

  /**
   * Elimina un gasto
   */
  async deleteExpense(expenseId: string): Promise<boolean> {
    const table = getTableClient("expenses");
    const { error } = await table.delete().eq("id", expenseId);

    if (error) {
      console.error("[expensesService] Error deleting expense:", error);
      return false;
    }

    return true;
  },
};
