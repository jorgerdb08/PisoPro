"use client";

import React, { useState } from "react";
import { useExpenses } from "@/features/expenses/useExpenses";
import { useAuth } from "@/features/auth/AuthContext";
import { ExpenseCard } from "./ExpenseCard";
import { BalancesSummary } from "./BalancesSummary";
import { MonthlyQuotaCard } from "./MonthlyQuotaCard";
import { MonthlyHistoryView } from "./MonthlyHistoryView";
import { CreateExpenseModal } from "./CreateExpenseModal";
import {
  Wallet,
  Plus,
  RotateCw,
  Scale,
  Loader2,
  Users,
  Calendar,
  BellRing,
  CheckCircle2,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ExpensesView() {
  const { currentUser } = useAuth();
  const {
    expenses,
    selectedMonth,
    setSelectedMonth,
    rentSummary,
    monthlyData,
    historyItems,
    isLoading,
    pendingTransfers,
    userSummary,
    addExpense,
    settleTransfer,
    removeExpense,
    markRentPaid,
    sendRentReminder,
    refreshExpenses,
  } = useExpenses();

  const [activeTab, setActiveTab] = useState<"quotas" | "history" | "balances">("quotas");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const isAdmin = currentUser?.role === "admin";
  const formatEuro = (num: number) => (num || 0).toFixed(2).replace(".", ",") + " €";

  const handleSendReminder = async () => {
    setIsSendingReminder(true);
    try {
      const sent = await sendRentReminder();
      if (sent) {
        setFeedbackBanner(
          `Aviso enviado al chat y notificaciones a los compañeros pendientes de pago.`
        );
      } else {
        setFeedbackBanner(`¡Todos los compañeros están al día con sus pagos!`);
      }
      setTimeout(() => setFeedbackBanner(null), 5000);
    } finally {
      setIsSendingReminder(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Feedback Banner */}
      {feedbackBanner && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-emerald-700 hover:underline font-bold text-[11px] ml-2"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#31405F] text-white shadow-xs">
              <Wallet className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-[#31405F] text-lg font-bold tracking-tight">
                Gastos & Alquiler
              </h2>
              <p className="text-[#607283] text-xs">
                Alquiler fijo de 600 € + suministros y variables
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void refreshExpenses()}
              title="Actualizar cuentas"
              className="text-[#607283] hover:text-[#31405F] flex h-8 w-8 items-center justify-center rounded-xl border border-[#BFC6CC]/60 transition-colors"
            >
              <RotateCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Total Month Spend & Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-[#BFC6CC]/30">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#607283] text-[10px] font-semibold uppercase tracking-wider block">
                Total {rentSummary.monthName}
              </span>
              <span className="rounded-full bg-[#31405F]/10 px-1.5 py-0.2 text-[9px] font-bold text-[#31405F]">
                {formatEuro(monthlyData.monthTotalSpend / 3)} / pers.
              </span>
            </div>
            <p className="text-[#31405F] text-xl font-extrabold tracking-tight">
              {formatEuro(monthlyData.monthTotalSpend)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendReminder}
              disabled={isSendingReminder}
              title="Avisar al chat y notificaciones de pagos pendientes"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#BFC6CC] bg-white px-3 py-2 text-xs font-semibold text-[#31405F] hover:bg-[#F4F7F8] active:scale-95 transition-all"
            >
              {isSendingReminder ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BellRing className="h-3.5 w-3.5 text-[#FF5722]" />
              )}
              <span>Avisar de Pago</span>
            </button>

            <button
              type="button"
              data-testid="open-create-expense-btn"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#31405F] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#194F6B] active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4 stroke-[2.25]" />
              <span>Nuevo Gasto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Regla Gamificación Alquiler: Días 1 al 5 */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5 text-xs text-amber-900">
        <Home className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <div className="flex-1 text-[11px] leading-relaxed">
          <strong className="font-bold text-amber-950">Regla del Alquiler (600 € total / 200 € por persona):</strong>{" "}
          Se abona del <strong>día 1 al 5</strong> de cada mes. Si pagas a tiempo sumas{" "}
          <strong className="text-emerald-700 font-bold">+1 punto de convivencia 🏆</strong>; si te retrasas se penaliza con{" "}
          <strong className="text-rose-600 font-bold">-1 punto ⚠️</strong>.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-[#F4F7F8] border border-[#BFC6CC]/60">
        <button
          type="button"
          data-testid="tab-quotas"
          onClick={() => setActiveTab("quotas")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
            activeTab === "quotas"
              ? "bg-white text-[#31405F] shadow-xs font-bold"
              : "text-[#607283] hover:text-[#31405F]"
          )}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Cuotas del Mes</span>
        </button>

        <button
          type="button"
          data-testid="tab-history"
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
            activeTab === "history"
              ? "bg-white text-[#31405F] shadow-xs font-bold"
              : "text-[#607283] hover:text-[#31405F]"
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Histórico Mensual</span>
        </button>

        <button
          type="button"
          data-testid="tab-balances"
          onClick={() => setActiveTab("balances")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
            activeTab === "balances"
              ? "bg-white text-[#31405F] shadow-xs font-bold"
              : "text-[#607283] hover:text-[#31405F]"
          )}
        >
          <Scale className="h-3.5 w-3.5" />
          <span>Balances & Deudas</span>
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center text-xs text-[#607283]">
          <Loader2 className="h-6 w-6 animate-spin text-[#31405F]" />
          <span>Cargando cuentas del piso...</span>
        </div>
      ) : activeTab === "quotas" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#31405F]">
              Desglose Individual de Cuotas ({rentSummary.monthName})
            </h3>
            <span className="text-[11px] text-[#607283]">
              {rentSummary.paidCount} de 3 alquileres pagados
            </span>
          </div>

          {/* Tarjetas individuales de cuota por compañero */}
          <div className="space-y-3">
            {monthlyData.shares.map((share) => {
              const rentStat = rentSummary.flatmateStatuses.find(
                (s) => s.userId === share.userId
              );
              const isCurrent = currentUser?.id === share.userId;

              return (
                <MonthlyQuotaCard
                  key={share.userId}
                  share={share}
                  rentStatus={rentStat}
                  isCurrentUser={isCurrent}
                  isAdmin={isAdmin}
                  onPayRent={markRentPaid}
                  onSendReminder={handleSendReminder}
                />
              );
            })}
          </div>
        </div>
      ) : activeTab === "history" ? (
        <MonthlyHistoryView
          historyItems={historyItems}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          expenses={expenses}
          currentUserId={currentUser?.id}
          isAdmin={isAdmin}
          onDeleteExpense={removeExpense}
        />
      ) : (
        <div className="space-y-4">
          <BalancesSummary
            userSummary={userSummary}
            pendingTransfers={pendingTransfers}
            currentUserId={currentUser?.id}
            onSettleTransfer={settleTransfer}
          />

          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#31405F]">
                Todos los Tickets Registrados ({expenses.length})
              </h4>
            </div>

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
              <div className="rounded-2xl border border-dashed border-[#BFC6CC] p-6 text-center text-xs text-[#607283] bg-white">
                No hay tickets registrados todavía.
              </div>
            )}
          </div>
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

