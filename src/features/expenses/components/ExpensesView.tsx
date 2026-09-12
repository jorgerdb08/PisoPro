"use client";

import React, { useState } from "react";
import { useExpenses } from "@/features/expenses/useExpenses";
import { useAuth } from "@/features/auth/AuthContext";
import { ExpenseCard } from "./ExpenseCard";
import { BalancesSummary } from "./BalancesSummary";
import { CreateExpenseModal } from "./CreateExpenseModal";
import {
  Wallet,
  Plus,
  RotateCw,
  Receipt,
  Scale,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ExpensesView() {
  const { currentUser } = useAuth();
  const {
    expenses,
    isLoading,
    pendingTransfers,
    userSummary,
    totalHouseholdSpend,
    addExpense,
    settleTransfer,
    removeExpense,
    refreshExpenses,
  } = useExpenses();

  const [activeTab, setActiveTab] = useState<"balances" | "history">("balances");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const formatEuro = (num: number) => num.toFixed(2).replace(".", ",") + " €";

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-secondary/30 p-5 shadow-xs backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-bold tracking-tight">
                Gastos Compartidos
              </h2>
              <p className="text-muted-foreground text-xs">
                Cuentas claras y reparto equitativo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void refreshExpenses()}
            title="Actualizar cuentas"
            className="text-muted-foreground hover:text-foreground flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 transition-colors"
          >
            <RotateCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>

        {/* Total Month Spend & Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <div>
            <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider block">
              Gasto Total del Piso
            </span>
            <p className="text-foreground text-lg font-extrabold tracking-tight">
              {formatEuro(totalHouseholdSpend)}
            </p>
          </div>

          <button
            type="button"
            data-testid="open-create-expense-btn"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Gasto</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-secondary/80 border border-border/60">
        <button
          type="button"
          data-testid="tab-balances"
          onClick={() => setActiveTab("balances")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
            activeTab === "balances"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Scale className="h-3.5 w-3.5" />
          <span>Balances & Deudas</span>
        </button>

        <button
          type="button"
          data-testid="tab-history"
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
            activeTab === "history"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Historial ({expenses.length})</span>
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center text-xs text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <span>Cargando cuentas del piso...</span>
        </div>
      ) : activeTab === "balances" ? (
        <BalancesSummary
          userSummary={userSummary}
          pendingTransfers={pendingTransfers}
          currentUserId={currentUser?.id}
          onSettleTransfer={settleTransfer}
        />
      ) : (
        <div className="space-y-2.5">
          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                currentUserId={currentUser?.id}
                isAdmin={isAdmin}
                onDelete={removeExpense}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 p-8 text-center space-y-2 bg-card/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <h4 className="text-foreground text-sm font-bold">Sin gastos registrados</h4>
              <p className="text-muted-foreground text-xs max-w-xs">
                Añade el primer ticket del piso para empezar a repartir costes equitativamente.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <CreateExpenseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUserId={currentUser?.id}
        onCreate={addExpense}
      />
    </div>
  );
}
