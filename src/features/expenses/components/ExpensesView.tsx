"use client";

import React, { useState } from "react";
import { useExpenses } from "@/features/expenses/useExpenses";
import { useAuth } from "@/features/auth/AuthContext";
import { CreateExpenseModal } from "./CreateExpenseModal";
import { ExpenseCard } from "./ExpenseCard";
import {
  Wallet,
  Plus,
  RotateCw,
  BellRing,
  CheckCircle2,
  Home,
  Zap,
  Droplet,
  Flame,
  Wifi,
  ShoppingCart,
  History,
  Scale,
  Loader2,
  Trash2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FLATMATES } from "@/lib/constants";

export function ExpensesView() {
  const { currentUser } = useAuth();
  const getFlatmateName = (id: string) =>
    FLATMATES.find((f) => f.id === id)?.name || "Compañero";
  const {
    expenses,
    selectedMonth,
    setSelectedMonth,
    rentSummary,
    monthlyData,
    historyItems,
    isLoading,
    pendingTransfers,
    addExpense,
    settleTransfer,
    removeExpense,
    toggleRentPaid,
    sendRentReminder,
    refreshExpenses,
  } = useExpenses();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<string>("compras");
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const safeRentSummary = rentSummary || {
    monthStr: selectedMonth || "2026-09",
    monthName: "Septiembre 2026",
    totalRent: 600,
    rentPerPerson: 200,
    paidCount: 0,
    totalCollected: 0,
    deadlineDay: 5,
    isDeadlinePassed: false,
    flatmateStatuses: [],
  };

  const safeMonthlyData = monthlyData || {
    shares: [],
    monthTotalSpend: 600,
    monthSuppliesTotal: 0,
    monthVariableTotal: 0,
  };

  const isAdmin = currentUser?.role === "admin";
  const formatEuro = (num: number) => (num || 0).toFixed(2).replace(".", ",") + " €";

  // Filtrar gastos del mes seleccionado
  const monthExpenses = expenses.filter(
    (e) => e.date && e.date.substring(0, 7) === selectedMonth
  );

  // Agrupación por apartados
  const luzExpenses = monthExpenses.filter(
    (e) => (e.category || "").toLowerCase() === "luz" || (e.category || "").toLowerCase() === "utilities"
  );
  const aguaExpenses = monthExpenses.filter(
    (e) => (e.category || "").toLowerCase() === "agua" || (e.category || "").toLowerCase() === "water"
  );
  const gasExpenses = monthExpenses.filter(
    (e) => (e.category || "").toLowerCase() === "gas"
  );
  const internetExpenses = monthExpenses.filter(
    (e) => (e.category || "").toLowerCase() === "internet" || (e.category || "").toLowerCase() === "wifi"
  );
  const otherExpenses = monthExpenses.filter((e) => {
    const cat = (e.category || "").toLowerCase();
    return (
      cat !== "alquiler" &&
      cat !== "settlement" &&
      cat !== "luz" &&
      cat !== "utilities" &&
      cat !== "agua" &&
      cat !== "water" &&
      cat !== "gas" &&
      cat !== "internet" &&
      cat !== "wifi"
    );
  });

  const luzTotal = luzExpenses.reduce((sum, e) => sum + e.amount, 0);
  const aguaTotal = aguaExpenses.reduce((sum, e) => sum + e.amount, 0);
  const gasTotal = gasExpenses.reduce((sum, e) => sum + e.amount, 0);
  const internetTotal = internetExpenses.reduce((sum, e) => sum + e.amount, 0);
  const otherTotal = otherExpenses.reduce((sum, e) => sum + e.amount, 0);

  const grandTotal =
    600 + luzTotal + aguaTotal + gasTotal + internetTotal + otherTotal;

  const openAddCategory = (category: string) => {
    setModalCategory(category);
    setIsCreateOpen(true);
  };

  const handleSendReminder = async () => {
    setIsSendingReminder(true);
    try {
      const sent = await sendRentReminder();
      if (sent) {
        setFeedbackBanner(
          `Aviso enviado al chat y notificaciones a los compañeros con pagos pendientes.`
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
    <div className="space-y-5 pb-24 max-w-3xl mx-auto">
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

      {/* Header Principal con Selector de Mes y Acciones */}
      <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#31405F] text-white shadow-xs">
              <Wallet className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-[#31405F] text-lg font-bold tracking-tight">
                Gastos del Piso
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-[#607283]" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-lg border border-[#BFC6CC]/80 bg-[#F4F7F8] px-2 py-0.5 text-xs font-bold text-[#31405F] focus:outline-hidden"
                >
                  {historyItems.map((h) => (
                    <option key={h.monthStr} value={h.monthStr}>
                      {h.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshExpenses()}
              title="Actualizar cuentas"
              className="text-[#607283] hover:text-[#31405F] flex h-8 w-8 items-center justify-center rounded-xl border border-[#BFC6CC]/60 transition-colors"
            >
              <RotateCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </button>

            <button
              type="button"
              onClick={handleSendReminder}
              disabled={isSendingReminder}
              title="Avisar a quien falte por pagar"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#BFC6CC] bg-white px-3 py-2 text-xs font-semibold text-[#31405F] hover:bg-[#F4F7F8] active:scale-95 transition-all"
            >
              {isSendingReminder ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BellRing className="h-3.5 w-3.5 text-[#FF5722]" />
              )}
              <span className="hidden sm:inline">Avisar pendientes</span>
            </button>

            <button
              type="button"
              data-testid="open-create-expense-btn"
              onClick={() => openAddCategory("compras")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#31405F] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#194F6B] active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4 stroke-[2.25]" />
              <span>+ Añadir Gasto</span>
            </button>
          </div>
        </div>

        {/* Resumen Total y Cuota Individual */}
        <div className="rounded-2xl bg-[#F4F7F8] border border-[#BFC6CC]/40 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#BFC6CC]/40 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#607283] block">
                Total Gastos {safeRentSummary.monthName}
              </span>
              <span className="text-2xl font-black text-[#31405F] tracking-tight">
                {formatEuro(grandTotal)}
              </span>
              <span className="text-[11px] text-[#607283] block mt-0.5">
                600 € alquiler + {formatEuro(grandTotal - 600)} en suministros y otros
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#607283] block">
                Total por persona
              </span>
              <span className="text-xl font-extrabold text-[#094152] tracking-tight">
                {formatEuro(grandTotal / 3)}
              </span>
              <span className="text-[11px] text-[#607283] block mt-0.5">
                (200 € alquiler + {formatEuro((grandTotal - 600) / 3)})
              </span>
            </div>
          </div>

          {/* Lo que tiene que pagar cada uno */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#607283] block">
              Desglose a pagar por inquilino:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {safeMonthlyData.shares.map((share) => {
                const rentStat = safeRentSummary.flatmateStatuses.find(
                  (s) => s.userId === share.userId
                );
                const isPaidRent = rentStat?.isPaid ?? false;

                return (
                  <div
                    key={share.userId}
                    className="rounded-xl border border-[#BFC6CC]/50 bg-white p-2.5 space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#31405F]">
                        {share.userName}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded-md font-bold",
                          isPaidRent
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {isPaidRent ? "Alquiler pagado" : "Alquiler pendiente"}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[#607283] text-[11px]">Total cuota:</span>
                      <span className="font-extrabold text-[#31405F]">
                        {formatEuro(share.totalToPay)}
                      </span>
                    </div>

                    {share.totalAdvanced > 0 && (
                      <div className="flex items-baseline justify-between text-[10px] text-[#607283]">
                        <span>Adelantado:</span>
                        <span className="font-semibold text-emerald-700">
                          -{formatEuro(share.totalAdvanced)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* APARTADOS POR SECCIONES (EN EL MISMO SITIO) */}
      {/* ========================================================================= */}

      <div className="space-y-4">
        {/* 1. APARTADO: ALQUILER (Fijo 600€ / 200€ cada uno) */}
        <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#31405F]/10 text-[#31405F] border border-[#31405F]/20">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#31405F]">Alquiler</h3>
                <p className="text-xs text-[#607283]">
                  Fijo de 600,00 € al mes (200,00 € por persona)
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-[#31405F]">
                {formatEuro(600)}
              </span>
              <span className="block text-[10px] text-[#607283]">
                {safeRentSummary.paidCount} de 3 pagados
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#BFC6CC]/30">
            {safeRentSummary.flatmateStatuses.map((flatmate) => {
              const isPaid = flatmate.isPaid;
              return (
                <div
                  key={flatmate.userId}
                  className="flex items-center justify-between rounded-xl border border-[#BFC6CC]/40 bg-[#F4F7F8]/40 p-2.5"
                >
                  <div>
                    <span className="text-xs font-bold text-[#31405F] block">
                      {flatmate.userName}
                    </span>
                    <span className="text-[11px] text-[#607283]">200,00 €</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void toggleRentPaid(flatmate.userId)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition-all active:scale-95 border",
                      isPaid
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                    )}
                  >
                    {isPaid ? "✓ Pagado" : "Pendiente"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. APARTADO: LUZ */}
        <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#31405F]">Luz</h3>
                <p className="text-xs text-[#607283]">
                  {luzTotal > 0
                    ? `Total: ${formatEuro(luzTotal)} (${formatEuro(luzTotal / 3)} cada uno)`
                    : "Sin factura registrada este mes"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-[#31405F]">
                {formatEuro(luzTotal)}
              </span>
              <button
                type="button"
                onClick={() => openAddCategory("luz")}
                className="rounded-xl border border-[#BFC6CC] bg-white px-2.5 py-1 text-xs font-semibold text-[#31405F] hover:bg-[#F4F7F8] active:scale-95 transition-all"
              >
                + Factura
              </button>
            </div>
          </div>

          {luzExpenses.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#BFC6CC]/30">
              {luzExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between rounded-xl bg-[#F4F7F8]/60 px-3 py-2 text-xs"
                >
                  <div>
                    <span className="font-semibold text-[#31405F]">
                      {exp.description}
                    </span>
                    <span className="text-[10px] text-[#607283] block">
                      {getFlatmateName(exp.paid_by)} · {exp.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#31405F]">
                      {formatEuro(exp.amount)}
                    </span>
                    {(isAdmin || exp.paid_by === currentUser?.id) && (
                      <button
                        type="button"
                        onClick={() => void removeExpense(exp.id)}
                        className="text-[#607283] hover:text-rose-600 p-1"
                        title="Eliminar factura"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. APARTADO: AGUA */}
        <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 border border-sky-500/20">
                <Droplet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#31405F]">Agua</h3>
                <p className="text-xs text-[#607283]">
                  {aguaTotal > 0
                    ? `Total: ${formatEuro(aguaTotal)} (${formatEuro(aguaTotal / 3)} cada uno)`
                    : "Sin factura registrada este mes"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-[#31405F]">
                {formatEuro(aguaTotal)}
              </span>
              <button
                type="button"
                onClick={() => openAddCategory("agua")}
                className="rounded-xl border border-[#BFC6CC] bg-white px-2.5 py-1 text-xs font-semibold text-[#31405F] hover:bg-[#F4F7F8] active:scale-95 transition-all"
              >
                + Factura
              </button>
            </div>
          </div>

          {aguaExpenses.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#BFC6CC]/30">
              {aguaExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between rounded-xl bg-[#F4F7F8]/60 px-3 py-2 text-xs"
                >
                  <div>
                    <span className="font-semibold text-[#31405F]">
                      {exp.description}
                    </span>
                    <span className="text-[10px] text-[#607283] block">
                      {getFlatmateName(exp.paid_by)} · {exp.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#31405F]">
                      {formatEuro(exp.amount)}
                    </span>
                    {(isAdmin || exp.paid_by === currentUser?.id) && (
                      <button
                        type="button"
                        onClick={() => void removeExpense(exp.id)}
                        className="text-[#607283] hover:text-rose-600 p-1"
                        title="Eliminar factura"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. APARTADO: GAS */}
        <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#31405F]">Gas</h3>
                <p className="text-xs text-[#607283]">
                  {gasTotal > 0
                    ? `Total: ${formatEuro(gasTotal)} (${formatEuro(gasTotal / 3)} cada uno)`
                    : "Sin factura registrada este mes"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-[#31405F]">
                {formatEuro(gasTotal)}
              </span>
              <button
                type="button"
                onClick={() => openAddCategory("gas")}
                className="rounded-xl border border-[#BFC6CC] bg-white px-2.5 py-1 text-xs font-semibold text-[#31405F] hover:bg-[#F4F7F8] active:scale-95 transition-all"
              >
                + Factura
              </button>
            </div>
          </div>

          {gasExpenses.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#BFC6CC]/30">
              {gasExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between rounded-xl bg-[#F4F7F8]/60 px-3 py-2 text-xs"
                >
                  <div>
                    <span className="font-semibold text-[#31405F]">
                      {exp.description}
                    </span>
                    <span className="text-[10px] text-[#607283] block">
                      {getFlatmateName(exp.paid_by)} · {exp.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#31405F]">
                      {formatEuro(exp.amount)}
                    </span>
                    {(isAdmin || exp.paid_by === currentUser?.id) && (
                      <button
                        type="button"
                        onClick={() => void removeExpense(exp.id)}
                        className="text-[#607283] hover:text-rose-600 p-1"
                        title="Eliminar factura"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. APARTADO: INTERNET */}
        <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#094152]/10 text-[#094152] border border-[#094152]/20">
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#31405F]">Internet / Fibra</h3>
                <p className="text-xs text-[#607283]">
                  {internetTotal > 0
                    ? `Total: ${formatEuro(internetTotal)} (${formatEuro(internetTotal / 3)} cada uno)`
                    : "Sin factura registrada este mes"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-[#31405F]">
                {formatEuro(internetTotal)}
              </span>
              <button
                type="button"
                onClick={() => openAddCategory("internet")}
                className="rounded-xl border border-[#BFC6CC] bg-white px-2.5 py-1 text-xs font-semibold text-[#31405F] hover:bg-[#F4F7F8] active:scale-95 transition-all"
              >
                + Factura
              </button>
            </div>
          </div>

          {internetExpenses.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#BFC6CC]/30">
              {internetExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between rounded-xl bg-[#F4F7F8]/60 px-3 py-2 text-xs"
                >
                  <div>
                    <span className="font-semibold text-[#31405F]">
                      {exp.description}
                    </span>
                    <span className="text-[10px] text-[#607283] block">
                      {getFlatmateName(exp.paid_by)} · {exp.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#31405F]">
                      {formatEuro(exp.amount)}
                    </span>
                    {(isAdmin || exp.paid_by === currentUser?.id) && (
                      <button
                        type="button"
                        onClick={() => void removeExpense(exp.id)}
                        className="text-[#607283] hover:text-rose-600 p-1"
                        title="Eliminar factura"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. APARTADO: OTRAS COSAS (COMPRAS, CENAS, OTROS) */}
        <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#31405F]">
                  Otras cosas (Compras, Cenas, etc.)
                </h3>
                <p className="text-xs text-[#607283]">
                  {otherExpenses.length} ticket(s) registrados este mes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-[#31405F]">
                {formatEuro(otherTotal)}
              </span>
              <button
                type="button"
                onClick={() => openAddCategory("compras")}
                className="rounded-xl border border-[#BFC6CC] bg-white px-2.5 py-1 text-xs font-semibold text-[#31405F] hover:bg-[#F4F7F8] active:scale-95 transition-all"
              >
                + Gasto
              </button>
            </div>
          </div>

          {otherExpenses.length > 0 ? (
            <div className="space-y-2 pt-2 border-t border-[#BFC6CC]/30">
              {otherExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  currentUserId={currentUser?.id}
                  isAdmin={isAdmin}
                  onDelete={removeExpense}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#607283] text-center py-2">
              No hay compras ni cenas registradas este mes.
            </p>
          )}
        </div>

        {/* 7. BALANCES & DEUDAS PENDIENTES ENTRE COMPAÑEROS */}
        {pendingTransfers.length > 0 && (
          <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#094152]/10 text-[#094152]">
                <Scale className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#31405F]">
                Ajustes de cuentas pendientes entre compañeros
              </h3>
            </div>

            <div className="space-y-2">
              {pendingTransfers.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-[#BFC6CC]/40 bg-[#F4F7F8]/40 p-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#31405F]">
                      {getFlatmateName(t.fromUserId)} debe a {getFlatmateName(t.toUserId)}
                    </div>
                    <div className="text-[11px] text-[#607283]">
                      Para equilibrar facturas o compras compartidas
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#31405F]">
                      {formatEuro(t.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void settleTransfer(t)}
                      className="rounded-lg bg-[#31405F] text-white px-2.5 py-1 text-xs font-bold hover:bg-[#194F6B] active:scale-95 transition-all"
                    >
                      Saldar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. HISTÓRICO MENSUAL DE GASTOS */}
        <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#31405F]/10 text-[#31405F]">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#31405F]">
                  Histórico de Meses
                </h3>
                <p className="text-[11px] text-[#607283]">
                  Cuánto pagamos cada mes (Alquiler 600€ + suministros)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-[#BFC6CC]/30">
            {historyItems.map((h) => {
              const isSelected = h.monthStr === selectedMonth;
              return (
                <button
                  key={h.monthStr}
                  type="button"
                  onClick={() => setSelectedMonth(h.monthStr)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl p-2.5 border transition-all text-center",
                    isSelected
                      ? "bg-[#31405F] text-white border-[#31405F] shadow-xs"
                      : "bg-[#F4F7F8] text-[#31405F] border-[#BFC6CC]/50 hover:bg-white"
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] uppercase font-bold",
                      isSelected ? "text-white/80" : "text-[#607283]"
                    )}
                  >
                    {h.displayName.split(" ")[0]}
                  </span>
                  <span className="text-xs font-black tracking-tight mt-0.5">
                    {formatEuro(h.grandTotal)}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] mt-0.5",
                      isSelected ? "text-white/70" : "text-[#607283]"
                    )}
                  >
                    {formatEuro(h.grandTotal / 3)} / p
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal para Crear / Añadir Gasto o Factura */}
      <CreateExpenseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUserId={currentUser?.id}
        defaultCategory={modalCategory}
        onCreate={addExpense}
      />
    </div>
  );
}
