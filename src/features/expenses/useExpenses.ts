"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { expensesService } from "@/services/expensesService";
import {
  calculateNetBalances,
  minimizeDebts,
  getUserBalanceSummary,
  type ExpenseItem,
  type DebtTransfer,
  type UserBalanceSummary,
} from "@/features/expenses/calculations";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { DEFAULT_HOUSEHOLD_ID, FLATMATES } from "@/lib/constants";

export function useExpenses() {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const supabase = getSupabaseBrowserClient();
  const flatmateIds = useMemo(() => FLATMATES.map((f) => f.id), []);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await expensesService.getExpenses(DEFAULT_HOUSEHOLD_ID);
      setExpenses(data);
    } catch (err) {
      console.error("[useExpenses] Error fetching expenses:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Realtime subscription on expenses and participants
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await expensesService.getExpenses(DEFAULT_HOUSEHOLD_ID);
        if (isMounted) {
          setExpenses(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[useExpenses] Error loading in effect:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    void load();

    const channel = supabase
      .channel("pisopro-expenses-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => {
          void load();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense_participants" },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Derived financial balances
  const netBalances = useMemo(() => {
    return calculateNetBalances(expenses, flatmateIds);
  }, [expenses, flatmateIds]);

  const pendingTransfers: DebtTransfer[] = useMemo(() => {
    return minimizeDebts(netBalances);
  }, [netBalances]);

  const userSummary: UserBalanceSummary = useMemo(() => {
    if (!currentUser) {
      return {
        userId: "",
        netBalance: 0,
        totalOwedByMe: 0,
        totalOwedToMe: 0,
      };
    }
    return getUserBalanceSummary(currentUser.id, netBalances, pendingTransfers);
  }, [currentUser, netBalances, pendingTransfers]);

  // Total household spend
  const totalHouseholdSpend = useMemo(() => {
    return expenses
      .filter((e) => e.category !== "settlement")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Add new expense
  const addExpense = useCallback(
    async (data: {
      description: string;
      amount: number;
      paid_by: string;
      category?: string;
      notes?: string;
      participantUserIds: string[];
    }) => {
      setIsSubmitting(true);
      try {
        const created = await expensesService.createExpense(data);
        if (created) {
          await fetchExpenses();
        }
        return created;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchExpenses]
  );

  // Settle debt transfer
  const settleTransfer = useCallback(
    async (transfer: DebtTransfer) => {
      setIsSubmitting(true);
      try {
        const ok = await expensesService.settleDebt(
          transfer.fromUserId,
          transfer.toUserId,
          transfer.amount,
          DEFAULT_HOUSEHOLD_ID
        );
        if (ok) {
          await fetchExpenses();
        }
        return ok;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchExpenses]
  );

  // Delete expense
  const removeExpense = useCallback(
    async (expenseId: string) => {
      setIsSubmitting(true);
      try {
        const ok = await expensesService.deleteExpense(expenseId);
        if (ok) {
          setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
        }
        return ok;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    expenses,
    isLoading,
    isSubmitting,
    netBalances,
    pendingTransfers,
    userSummary,
    totalHouseholdSpend,
    addExpense,
    settleTransfer,
    removeExpense,
    refreshExpenses: fetchExpenses,
  };
}
