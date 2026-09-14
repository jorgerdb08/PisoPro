import { useState, useEffect, useCallback, useMemo } from "react";
import { expensesService } from "@/services/expensesService";
import {
  calculateNetBalances,
  minimizeDebts,
  getUserBalanceSummary,
  calculateMonthlyUserShares,
  getMonthlyHistoricalBreakdown,
  type ExpenseItem,
  type DebtTransfer,
  type UserBalanceSummary,
} from "@/features/expenses/calculations";
import { rentService, getCurrentMonthStr, type MonthlyRentSummary } from "@/services/rentService";
import { notificationService } from "@/features/notifications/notificationService";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { DEFAULT_HOUSEHOLD_ID, FLATMATES } from "@/lib/constants";

export function useExpenses() {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthStr());
  const [rentVersion, setRentVersion] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const supabase = getSupabaseBrowserClient();
  const flatmateIds = useMemo(() => FLATMATES.map((f) => f.id), []);

  const rentSummary: MonthlyRentSummary = useMemo(() => {
    // Recompute when selectedMonth or rentVersion changes
    void rentVersion;
    return rentService.getMonthlyRentStatus(DEFAULT_HOUSEHOLD_ID, selectedMonth);
  }, [selectedMonth, rentVersion]);

  const refreshRentStatus = useCallback(() => {
    setRentVersion((v) => v + 1);
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await expensesService.getExpenses(DEFAULT_HOUSEHOLD_ID);
      setExpenses(data);
      refreshRentStatus();
    } catch (err) {
      console.error("[useExpenses] Error fetching expenses:", err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshRentStatus]);

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

    const handleRentUpdate = () => {
      refreshRentStatus();
    };
    window.addEventListener("pisopro-rent-updated", handleRentUpdate);

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
      window.removeEventListener("pisopro-rent-updated", handleRentUpdate);
    };
  }, [supabase, refreshRentStatus]);

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

  // Monthly individual shares and breakdown
  const monthlyData = useMemo(() => {
    return calculateMonthlyUserShares(expenses, selectedMonth);
  }, [expenses, selectedMonth]);

  // Historical 6-month breakdown
  const historyItems = useMemo(() => {
    return getMonthlyHistoricalBreakdown(expenses, 6);
  }, [expenses]);

  // Total household spend across all expenses
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
      date?: string;
      participantUserIds: string[];
    }) => {
      setIsSubmitting(true);
      try {
        const created = await expensesService.createExpense(data);
        if (created) {
          await fetchExpenses();
          try {
            const payer = FLATMATES.find((f) => f.id === data.paid_by);
            const payerName = payer?.name || "Un compañero";
            void notificationService.dispatchNotification({
              type: "expense_notice",
              title: `💰 Nuevo gasto: ${data.description}`,
              body: `${payerName} ha registrado ${data.amount.toFixed(2).replace(".", ",")} € en "${data.description}" (${data.category || "general"}).`,
              householdId: DEFAULT_HOUSEHOLD_ID,
              actorUserId: data.paid_by,
              actorName: payerName,
              data: { url: "/gastos", expenseId: created.id },
            });
          } catch (err) {
            console.warn("[useExpenses] Error sending expense notice:", err);
          }
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
    async (transfer: {
      fromUserId: string;
      toUserId: string;
      amount: number;
      debtKey?: string;
      concept?: string;
    }) => {
      setIsSubmitting(true);
      try {
        const created = await expensesService.settleDebt(
          transfer.fromUserId,
          transfer.toUserId,
          transfer.amount,
          DEFAULT_HOUSEHOLD_ID,
          transfer.debtKey,
          transfer.concept
        );
        if (created) {
          await fetchExpenses();
        }
        return created !== null;
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

  // Record rent payment for a flatmate
  const markRentPaid = useCallback(
    async (userId: string, paidDate?: string) => {
      setIsSubmitting(true);
      try {
        const res = await rentService.recordRentPayment({
          householdId: DEFAULT_HOUSEHOLD_ID,
          userId,
          monthStr: selectedMonth,
          paidDate,
        });
        refreshRentStatus();
        return res;
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedMonth, refreshRentStatus]
  );

  // Toggle rent payment (1-click)
  const toggleRentPaid = useCallback(
    async (userId: string) => {
      setIsSubmitting(true);
      try {
        const res = await rentService.toggleRentPayment({
          householdId: DEFAULT_HOUSEHOLD_ID,
          userId,
          monthStr: selectedMonth,
        });
        refreshRentStatus();
        return res;
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedMonth, refreshRentStatus]
  );

  // Send rent reminder to pending flatmates
  const sendRentReminder = useCallback(async () => {
    return rentService.sendRentPaymentReminder(DEFAULT_HOUSEHOLD_ID, selectedMonth);
  }, [selectedMonth]);

  return {
    expenses,
    selectedMonth,
    setSelectedMonth,
    rentSummary,
    monthlyData,
    historyItems,
    isLoading,
    isSubmitting,
    netBalances,
    pendingTransfers,
    userSummary,
    totalHouseholdSpend,
    addExpense,
    settleTransfer,
    removeExpense,
    markRentPaid,
    toggleRentPaid,
    sendRentReminder,
    refreshExpenses: fetchExpenses,
  };
}

