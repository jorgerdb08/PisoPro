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
  Scale,
  Trash2,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FLATMATES } from "@/lib/constants";
import { MonthlyHistoryView } from "./MonthlyHistoryView";
import { DebtsView } from "./DebtsView";

type ExpensesTab = "gastos" | "deudas" | "historico";

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
    netBalances,
    pendingTransfers,
    addExpense,
    settleTransfer,
    removeExpense,
    toggleRentPaid,
    sendRentReminder,
    refreshExpenses,
  } = useExpenses();

  const [activeTab, setActiveTab] = useState<ExpensesTab>("gastos");
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

  // Cuota y estado personal del usuario logueado
  const myShare = safeMonthlyData.shares.find((s) => s.userId === currentUser?.id) || {
    userId: currentUser?.id || "",
    userName: currentUser?.name || "Tú",
    rentAmount: 200,
    suppliesShare: (luzTotal + aguaTotal + gasTotal + internetTotal) / 3,
    variableShare: otherTotal / 3,
    totalToPay: 200 + (luzTotal + aguaTotal + gasTotal + internetTotal + otherTotal) / 3,
    totalAdvanced: 0,
    netMonthBalance: 0,
  };

  const myRentStatus = safeRentSummary.flatmateStatuses.find(
    (s) => s.userId === currentUser?.id
  );
  const isMyRentPaid = myRentStatus?.isPaid ?? false;

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

      {/* Selector de Pestañas: Gastos / Deudas / Histórico */}
      <div className="flex rounded-2xl bg-[#F4F7F8] p-1 border border-[#BFC6CC]/60 max-w-md mx-auto w-full">
        <button
          type="button"
          onClick={() => setActiveTab("gastos")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all",
            activeTab === "gastos"
              ? "bg-white text-[#31405F] shadow-xs"
              : "text-[#607283] hover:text-[#31405F]"
          )}
        >
          <Wallet className="h-4 w-4" />
          <span>Gastos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("deudas")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all relative",
            activeTab === "deudas"
              ? "bg-white text-[#31405F] shadow-xs"
              : "text-[#607283] hover:text-[#31405F]"
          )}
        >
          <Scale className="h-4 w-4" />
          <span>Deudas</span>
          {pendingTransfers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold leading-none">
              {pendingTransfers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("historico")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all",
            activeTab === "historico"
              ? "bg-white text-[#31405F] shadow-xs"
              : "text-[#607283] hover:text-[#31405F]"
          )}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Histórico</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: GASTOS DEL MES (POR APARTADOS) */}
      {/* ========================================================================= */}
      {activeTab === "gastos" && (
        <div className="space-y-4 animate-in fade-in-50 duration-150">
          {/* ================================================================= */}
          {/* HERO CARD: LO QUE TIENES QUE PAGAR TÚ */}
          {/* ================================================================= */}
          <div className="rounded-3xl border border-[#BFC6CC]/70 bg-gradient-to-b from-white to-[#F4F7F8] p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#607283]">
                  {currentUser ? `Tu resumen · ${currentUser.name}` : "Tu cuota"}
                </span>
                <div className="mt-0.5">
                  <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#31405F] whitespace-nowrap">
                    {formatEuro(myShare.totalToPay)}
                  </div>
                  <p className="text-xs font-medium text-[#607283] mt-0.5">
                    Total a pagar por ti en {safeRentSummary.monthName}
                  </p>
                </div>
                {myShare.totalAdvanced > 0 && (
                  <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                    ✓ Has adelantado {formatEuro(myShare.totalAdvanced)} (ya descontado de tu cuota)
                  </p>
                )}
              </div>

              {/* Selector de Mes y Actualizar */}
              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-xl border border-[#BFC6CC] bg-white px-2.5 py-1.5 text-xs font-bold text-[#31405F] shadow-2xs focus:outline-hidden"
                >
                  {historyItems.map((h) => (
                    <option key={h.monthStr} value={h.monthStr}>
                      {h.displayName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void refreshExpenses()}
                  title="Actualizar cuentas"
                  className="text-[#607283] hover:text-[#31405F] flex h-8 w-8 items-center justify-center rounded-xl border border-[#BFC6CC] bg-white transition-colors shadow-2xs"
                >
                  <RotateCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                </button>
              </div>
            </div>

            {/* Desglose de TU Cuota */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[#BFC6CC]/40">
              {/* 1. Tu Alquiler */}
              <div className="rounded-2xl border border-[#BFC6CC]/60 bg-white p-3.5 space-y-2 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-[#607283]">Tu alquiler</span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap",
                        isMyRentPaid
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {isMyRentPaid ? "✓ Pagado" : "Pendiente"}
                    </span>
                  </div>
                  <div className="text-xl font-black text-[#31405F] whitespace-nowrap mt-1">
                    200,00 €
                  </div>
                </div>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => void toggleRentPaid(currentUser.id)}
                    className={cn(
                      "w-full text-center py-1.5 px-2 rounded-xl text-xs font-bold transition-all active:scale-95 border whitespace-nowrap mt-1 shadow-2xs",
                      isMyRentPaid
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        : "bg-[#31405F] text-white border-[#31405F] hover:bg-[#194F6B]"
                    )}
                  >
                    {isMyRentPaid ? "Marcar pendiente" : "Marcar como pagado"}
                  </button>
                )}
              </div>

              {/* 2. Tus Suministros */}
              <div className="rounded-2xl border border-[#BFC6CC]/60 bg-white p-3.5 space-y-1 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#607283] block">
                    Tus suministros
                  </span>
                  <div className="text-xl font-black text-[#31405F] whitespace-nowrap mt-1">
                    {formatEuro(myShare.suppliesShare)}
                  </div>
                </div>
                <span className="text-[10px] text-[#607283] block">
                  Luz, agua, gas e internet
                </span>
              </div>

              {/* 3. Tus Compras / Otros */}
              <div className="rounded-2xl border border-[#BFC6CC]/60 bg-white p-3.5 space-y-1 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#607283] block">
                    Compras y otros
                  </span>
                  <div className="text-xl font-black text-[#31405F] whitespace-nowrap mt-1">
                    {formatEuro(myShare.variableShare)}
                  </div>
                </div>
                <span className="text-[10px] text-[#607283] block">
                  Tickets y compras compartidas
                </span>
              </div>
            </div>

            {/* Resumen del Piso & Acciones */}
            <div className="flex items-center justify-between pt-3 border-t border-[#BFC6CC]/40 text-xs text-[#607283] flex-wrap gap-2">
              <div>
                <span className="font-semibold text-[#31405F]">Total del piso:</span>{" "}
                <span className="font-extrabold text-[#31405F] whitespace-nowrap">
                  {formatEuro(grandTotal)}
                </span>{" "}
                <span>(600 € alquiler + {formatEuro(grandTotal - 600)} suministros/otros)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={isSendingReminder}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#BFC6CC] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#31405F] hover:bg-[#F4F7F8] active:scale-95 transition-all shadow-2xs"
                >
                  <BellRing className="h-3.5 w-3.5 text-[#FF5722]" />
                  <span>Avisar pendientes</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAddCategory("compras")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#31405F] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#194F6B] active:scale-95 transition-all shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.25]" />
                  <span>+ Añadir Gasto</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* SECCIONES POR APARTADOS (ORDENADAS Y ESPACIOSAS) */}
          {/* ================================================================= */}
          <div className="space-y-4">
            {/* 1. APARTADO: ALQUILER */}
            <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#31405F]/10 text-[#31405F] border border-[#31405F]/20">
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#31405F]">Alquiler del Piso</h3>
                    <p className="text-xs text-[#607283]">
                      Fijo de 600,00 € al mes (200,00 € por persona)
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-[#31405F] whitespace-nowrap block">
                    600,00 €
                  </span>
                  <span className="text-[10px] text-[#607283] whitespace-nowrap block">
                    {safeRentSummary.paidCount} de 3 pagados
                  </span>
                </div>
              </div>

              {/* Lista limpia de cada compañero */}
              <div className="space-y-2 pt-2 border-t border-[#BFC6CC]/30">
                {safeRentSummary.flatmateStatuses.map((flatmate) => {
                  const isPaid = flatmate.isPaid;
                  const isMe = flatmate.userId === currentUser?.id;
                  const flatmateDef = FLATMATES.find((f) => f.id === flatmate.userId);
                  const colorClass = flatmateDef?.color || "bg-[#31405F] text-white";

                  return (
                    <div
                      key={flatmate.userId}
                      className={cn(
                        "flex items-center justify-between rounded-2xl p-3 transition-all border",
                        isMe
                          ? "bg-[#31405F]/5 border-[#31405F]/30"
                          : "bg-[#F4F7F8]/50 border-[#BFC6CC]/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-2xs",
                            colorClass
                          )}
                        >
                          {flatmate.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#31405F]">
                              {flatmate.userName}
                            </span>
                            {isMe && (
                              <span className="text-[9px] font-bold bg-[#31405F] text-white px-1.5 py-0.2 rounded-md">
                                Tú
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#607283] whitespace-nowrap">
                            Cuota: 200,00 €
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void toggleRentPaid(flatmate.userId)}
                        className={cn(
                          "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 border whitespace-nowrap min-w-[90px] text-center",
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#31405F]">Luz</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 whitespace-nowrap">
                        Tu parte: {formatEuro(luzTotal / 3)}
                      </span>
                    </div>
                    <p className="text-xs text-[#607283] mt-0.5">
                      {luzTotal > 0
                        ? `Total piso: ${formatEuro(luzTotal)} (${luzExpenses.length} factura${luzExpenses.length > 1 ? "s" : ""})`
                        : "Sin factura registrada este mes"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base font-extrabold text-[#31405F] whitespace-nowrap">
                    {formatEuro(luzTotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openAddCategory("luz")}
                    className="rounded-xl border border-[#BFC6CC] bg-[#F4F7F8] px-2.5 py-1 text-xs font-semibold text-[#31405F] hover:bg-white active:scale-95 transition-all shadow-2xs"
                  >
                    + Factura
                  </button>
                </div>
              </div>

              {luzExpenses.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#BFC6CC]/30">
                  {luzExpenses.map((exp) => {
                    const isMyExpense = exp.paid_by === currentUser?.id;
                    const payerName = getFlatmateName(exp.paid_by);
                    return (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between rounded-xl bg-[#F4F7F8]/60 px-3 py-2 text-xs border border-[#BFC6CC]/30"
                      >
                        <div>
                          <span className="font-semibold text-[#31405F] block">
                            {exp.description}
                          </span>
                          <span className="text-[10px] text-[#607283]">
                            {isMyExpense ? "Pagada por ti" : `Pagada por ${payerName}`} · {exp.date}
                            {isMyExpense
                              ? ` (te corresponden ${formatEuro((exp.amount / 3) * 2)} a favor)`
                              : ` (tu parte: ${formatEuro(exp.amount / 3)})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-[#31405F] whitespace-nowrap">
                            {formatEuro(exp.amount)}
                          </span>
                          {(isAdmin || isMyExpense) && (
                            <button
                              type="button"
                              onClick={() => void removeExpense(exp.id)}
                              className="text-[#607283] hover:text-rose-600 p-1 transition-colors"
                              title="Eliminar factura"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. APARTADO: AGUA */}
            <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 border border-sky-500/20">
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#31405F]">Agua</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200/60 whitespace-nowrap">
                        Tu parte: {formatEuro(aguaTotal / 3)}
                      </span>
                    </div>
                    <p className="text-xs text-[#607283] mt-0.5">
                      {aguaTotal > 0
                        ? `Total piso: ${formatEuro(aguaTotal)} (${aguaExpenses.length} factura${aguaExpenses.length > 1 ? "s" : ""})`
                        : "Sin factura registrada este mes"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base font-extrabold text-[#31405F] whitespace-nowrap">
                    {formatEuro(aguaTotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openAddCategory("agua")}
                    className="rounded-xl border border-[#BFC6CC] bg-[#F4F7F8] px-2.5 py-1 text-xs font-semibold text-[#31405F] hover:bg-white active:scale-95 transition-all shadow-2xs"
                  >
                    + Factura
                  </button>
                </div>
              </div>

              {aguaExpenses.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#BFC6CC]/30">
                  {aguaExpenses.map((exp) => {
                    const isMyExpense = exp.paid_by === currentUser?.id;
                    const payerName = getFlatmateName(exp.paid_by);
                    return (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between rounded-xl bg-[#F4F7F8]/60 px-3 py-2 text-xs border border-[#BFC6CC]/30"
                      >
                        <div>
                          <span className="font-semibold text-[#31405F] block">
                            {exp.description}
                          </span>
                          <span className="text-[10px] text-[#607283]">
                            {isMyExpense ? "Pagada por ti" : `Pagada por ${payerName}`} · {exp.date}
                            {isMyExpense
                              ? ` (te corresponden ${formatEuro((exp.amount / 3) * 2)} a favor)`
                              : ` (tu parte: ${formatEuro(exp.amount / 3)})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-[#31405F] whitespace-nowrap">
                            {formatEuro(exp.amount)}
                          </span>
                          {(isAdmin || isMyExpense) && (
                            <button
                              type="button"
                              onClick={() => void removeExpense(exp.id)}
                              className="text-[#607283] hover:text-rose-600 p-1 transition-colors"
                              title="Eliminar factura"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. APARTADO: GAS */}
            <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#31405F]">Gas</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200/60 whitespace-nowrap">
                        Tu parte: {formatEuro(gasTotal / 3)}
                      </span>
                    </div>
                    <p className="text-xs text-[#607283] mt-0.5">
                      {gasTotal > 0
                        ? `Total piso: ${formatEuro(gasTotal)} (${gasExpenses.length} factura${gasExpenses.length > 1 ? "s" : ""})`
                        : "Sin factura registrada este mes"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base font-extrabold text-[#31405F] whitespace-nowrap">
                    {formatEuro(gasTotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openAddCategory("gas")}
                    className="rounded-xl border border-[#BFC6CC] bg-[#F4F7F8] px-2.5 py-1 text-xs font-semibold text-[#31405F] hover:bg-white active:scale-95 transition-all shadow-2xs"
                  >
                    + Factura
                  </button>
                </div>
              </div>

              {gasExpenses.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#BFC6CC]/30">
                  {gasExpenses.map((exp) => {
                    const isMyExpense = exp.paid_by === currentUser?.id;
                    const payerName = getFlatmateName(exp.paid_by);
                    return (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between rounded-xl bg-[#F4F7F8]/60 px-3 py-2 text-xs border border-[#BFC6CC]/30"
                      >
                        <div>
                          <span className="font-semibold text-[#31405F] block">
                            {exp.description}
                          </span>
                          <span className="text-[10px] text-[#607283]">
                            {isMyExpense ? "Pagada por ti" : `Pagada por ${payerName}`} · {exp.date}
                            {isMyExpense
                              ? ` (te corresponden ${formatEuro((exp.amount / 3) * 2)} a favor)`
                              : ` (tu parte: ${formatEuro(exp.amount / 3)})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-[#31405F] whitespace-nowrap">
                            {formatEuro(exp.amount)}
                          </span>
                          {(isAdmin || isMyExpense) && (
                            <button
                              type="button"
                              onClick={() => void removeExpense(exp.id)}
                              className="text-[#607283] hover:text-rose-600 p-1 transition-colors"
                              title="Eliminar factura"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. APARTADO: INTERNET */}
            <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#094152]/10 text-[#094152] border border-[#094152]/20">
                    <Wifi className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#31405F]">Internet / Fibra</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#094152]/10 text-[#094152] border border-[#094152]/20 whitespace-nowrap">
                        Tu parte: {formatEuro(internetTotal / 3)}
                      </span>
                    </div>
                    <p className="text-xs text-[#607283] mt-0.5">
                      {internetTotal > 0
                        ? `Total piso: ${formatEuro(internetTotal)} (${internetExpenses.length} factura${internetExpenses.length > 1 ? "s" : ""})`
                        : "Sin factura registrada este mes"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base font-extrabold text-[#31405F] whitespace-nowrap">
                    {formatEuro(internetTotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openAddCategory("internet")}
                    className="rounded-xl border border-[#BFC6CC] bg-[#F4F7F8] px-2.5 py-1 text-xs font-semibold text-[#31405F] hover:bg-white active:scale-95 transition-all shadow-2xs"
                  >
                    + Factura
                  </button>
                </div>
              </div>

              {internetExpenses.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#BFC6CC]/30">
                  {internetExpenses.map((exp) => {
                    const isMyExpense = exp.paid_by === currentUser?.id;
                    const payerName = getFlatmateName(exp.paid_by);
                    return (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between rounded-xl bg-[#F4F7F8]/60 px-3 py-2 text-xs border border-[#BFC6CC]/30"
                      >
                        <div>
                          <span className="font-semibold text-[#31405F] block">
                            {exp.description}
                          </span>
                          <span className="text-[10px] text-[#607283]">
                            {isMyExpense ? "Pagada por ti" : `Pagada por ${payerName}`} · {exp.date}
                            {isMyExpense
                              ? ` (te corresponden ${formatEuro((exp.amount / 3) * 2)} a favor)`
                              : ` (tu parte: ${formatEuro(exp.amount / 3)})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-[#31405F] whitespace-nowrap">
                            {formatEuro(exp.amount)}
                          </span>
                          {(isAdmin || isMyExpense) && (
                            <button
                              type="button"
                              onClick={() => void removeExpense(exp.id)}
                              className="text-[#607283] hover:text-rose-600 p-1 transition-colors"
                              title="Eliminar factura"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 6. APARTADO: OTRAS COSAS (COMPRAS, CENAS, ETC.) */}
            <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#31405F]">
                        Otras cosas (Compras, Cenas...)
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 whitespace-nowrap">
                        Tu parte: {formatEuro(otherTotal / 3)}
                      </span>
                    </div>
                    <p className="text-xs text-[#607283] mt-0.5">
                      {otherExpenses.length} ticket(s) registrados este mes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base font-extrabold text-[#31405F] whitespace-nowrap">
                    {formatEuro(otherTotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openAddCategory("compras")}
                    className="rounded-xl border border-[#BFC6CC] bg-[#F4F7F8] px-2.5 py-1 text-xs font-semibold text-[#31405F] hover:bg-white active:scale-95 transition-all shadow-2xs"
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: DEUDAS Y AJUSTES CON FLECHA */}
      {/* ========================================================================= */}
      {activeTab === "deudas" && (
        <div className="animate-in fade-in-50 duration-150">
          <DebtsView
            pendingTransfers={pendingTransfers}
            netBalances={netBalances}
            onSettleTransfer={settleTransfer}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: HISTÓRICO CON GRÁFICA */}
      {/* ========================================================================= */}
      {activeTab === "historico" && (
        <div className="animate-in fade-in-50 duration-150">
          <MonthlyHistoryView
            historyItems={historyItems}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            expenses={expenses}
            currentUserId={currentUser?.id}
            isAdmin={isAdmin}
            onDeleteExpense={removeExpense}
          />
        </div>
      )}

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
