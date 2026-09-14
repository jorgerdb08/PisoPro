"use client";

import React, { useState } from "react";
import { useExpenses } from "@/features/expenses/useExpenses";
import { useAuth } from "@/features/auth/AuthContext";
import { CreateExpenseModal } from "./CreateExpenseModal";
import { FlatmatesRentModal } from "./FlatmatesRentModal";
import { ExpenseCategoryIcon } from "./ExpenseCategoryIcon";
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
  Users,
  FilterX,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  Award,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FLATMATES } from "@/lib/constants";
import { MonthlyHistoryView } from "./MonthlyHistoryView";
import { DebtsView } from "./DebtsView";

type ExpensesTab = "gastos" | "deudas" | "historico";

export function ExpensesView() {
  const { currentUser } = useAuth();
  const getFlatmate = (id: string) =>
    FLATMATES.find((f) => f.id === id) || {
      id,
      name: "Compañero",
      color: "bg-slate-700 text-white",
    };

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
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isRentInfoModalOpen, setIsRentInfoModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
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
  const formatEuro = (num: number) =>
    (num || 0).toFixed(2).replace(".", ",") + " €";

  // Filtrar gastos del mes seleccionado
  const monthExpenses = expenses.filter(
    (e) => e.date && e.date.substring(0, 7) === selectedMonth
  );

  // Totales por categoría
  const luzExpenses = monthExpenses.filter((e) => {
    const c = (e.category || "").toLowerCase();
    return c === "luz" || c === "utilities";
  });
  const aguaExpenses = monthExpenses.filter((e) => {
    const c = (e.category || "").toLowerCase();
    return c === "agua" || c === "water";
  });
  const gasExpenses = monthExpenses.filter((e) => {
    const c = (e.category || "").toLowerCase();
    return c === "gas";
  });
  const internetExpenses = monthExpenses.filter((e) => {
    const c = (e.category || "").toLowerCase();
    return c === "internet" || c === "wifi";
  });
  const otherExpenses = monthExpenses.filter((e) => {
    const c = (e.category || "").toLowerCase();
    return (
      c !== "alquiler" &&
      c !== "rent" &&
      c !== "settlement" &&
      c !== "luz" &&
      c !== "utilities" &&
      c !== "agua" &&
      c !== "water" &&
      c !== "gas" &&
      c !== "internet" &&
      c !== "wifi"
    );
  });

  const luzTotal = luzExpenses.reduce((sum, e) => sum + e.amount, 0);
  const aguaTotal = aguaExpenses.reduce((sum, e) => sum + e.amount, 0);
  const gasTotal = gasExpenses.reduce((sum, e) => sum + e.amount, 0);
  const internetTotal = internetExpenses.reduce((sum, e) => sum + e.amount, 0);
  const otherTotal = otherExpenses.reduce((sum, e) => sum + e.amount, 0);

  const suppliesTotal = luzTotal + aguaTotal + gasTotal + internetTotal;
  const grandTotal = 600 + suppliesTotal + otherTotal;

  // Cuota personal del usuario logueado
  const myShare = safeMonthlyData.shares.find((s) => s.userId === currentUser?.id) || {
    userId: currentUser?.id || "",
    userName: currentUser?.name || "Tú",
    rentAmount: 200,
    suppliesShare: suppliesTotal / 3,
    variableShare: otherTotal / 3,
    totalToPay: 200 + (suppliesTotal + otherTotal) / 3,
    totalAdvanced: 0,
    netMonthBalance: 0,
  };


  // Filtrado de gastos para el feed
  const displayedExpenses = monthExpenses.filter((e) => {
    if (e.category === "settlement") return false;
    if (!selectedCategoryFilter) return true;
    const cat = (e.category || "").toLowerCase();
    if (selectedCategoryFilter === "luz") return cat === "luz" || cat === "utilities";
    if (selectedCategoryFilter === "agua") return cat === "agua" || cat === "water";
    if (selectedCategoryFilter === "gas") return cat === "gas";
    if (selectedCategoryFilter === "internet") return cat === "internet" || cat === "wifi";
    if (selectedCategoryFilter === "compras") {
      return (
        cat !== "alquiler" &&
        cat !== "rent" &&
        cat !== "settlement" &&
        cat !== "luz" &&
        cat !== "utilities" &&
        cat !== "agua" &&
        cat !== "water" &&
        cat !== "gas" &&
        cat !== "internet" &&
        cat !== "wifi"
      );
    }
    return true;
  });

  const openAddCategory = (category: string) => {
    setModalCategory(category);
    setIsCreateOpen(true);
  };

  const handleDirectAddRent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const jorge = FLATMATES.find((f) => f.name === "Jorge");
    const payerId = jorge?.id || currentUser?.id || FLATMATES[0]?.id || "";
    const created = await addExpense({
      description: `Alquiler ${safeRentSummary.monthName || selectedMonth}`,
      amount: 600,
      paid_by: payerId,
      category: "alquiler",
      date: `${selectedMonth}-01`,
      participantUserIds: FLATMATES.map((f) => f.id),
    });
    if (created) {
      setFeedbackBanner(
        `✓ Alquiler de 600,00 € registrado para ${safeRentSummary.monthName || selectedMonth}.`
      );
      setTimeout(() => setFeedbackBanner(null), 4000);
    }
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

  // Categorías interactivas para el grid visual
  const serviceCategories = [
    {
      id: "alquiler",
      name: "Alquiler",
      icon: Home,
      total: 600,
      badge: `${safeRentSummary.paidCount}/3 pagados`,
      colorClass: "bg-[#31405F]/10 text-[#31405F] border-[#31405F]/20",
      accentBg: "hover:border-[#31405F]/50",
      isRent: true,
      myPart: 200,
    },
    {
      id: "luz",
      name: "Luz",
      icon: Zap,
      total: luzTotal,
      count: luzExpenses.length,
      colorClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      accentBg: "hover:border-amber-400",
      myPart: luzTotal / 3,
    },
    {
      id: "agua",
      name: "Agua",
      icon: Droplet,
      total: aguaTotal,
      count: aguaExpenses.length,
      colorClass: "bg-sky-500/10 text-sky-600 border-sky-500/20",
      accentBg: "hover:border-sky-400",
      myPart: aguaTotal / 3,
    },
    {
      id: "gas",
      name: "Gas",
      icon: Flame,
      total: gasTotal,
      count: gasExpenses.length,
      colorClass: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      accentBg: "hover:border-orange-400",
      myPart: gasTotal / 3,
    },
    {
      id: "internet",
      name: "Wifi",
      icon: Wifi,
      total: internetTotal,
      count: internetExpenses.length,
      colorClass: "bg-[#094152]/10 text-[#094152] border-[#094152]/20",
      accentBg: "hover:border-[#094152]/40",
      myPart: internetTotal / 3,
    },
    {
      id: "compras",
      name: "Compras",
      icon: ShoppingCart,
      total: otherTotal,
      count: otherExpenses.length,
      colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      accentBg: "hover:border-emerald-400",
      myPart: otherTotal / 3,
    },
  ];

  return (
    <div className="space-y-4 pb-24 max-w-3xl mx-auto">
      {/* Banner de feedback */}
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
      {/* PESTAÑA 1: GASTOS (SIMPLE, CENTRALIZADO Y ULTRA-VISUAL) */}
      {/* ========================================================================= */}
      {activeTab === "gastos" && (
        <div className="space-y-4 animate-in fade-in-50 duration-150">
          {/* ================================================================= */}
          {/* TARJETA WALLET PERSONAL (HERO) */}
          {/* ================================================================= */}
          <div className="rounded-3xl border border-[#BFC6CC]/70 bg-gradient-to-b from-white to-[#F4F7F8] p-4 sm:p-5 shadow-xs space-y-4">
            {/* Header del Hero: Saludo + Selector de mes */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#607283]">
                  {currentUser ? `Tu cuota · ${currentUser.name}` : "Tu resumen"}
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

            {/* Desglose rápido de tu cuota */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-[#BFC6CC]/40">
              {/* Bloque 1: Tu Alquiler */}
              <div className="rounded-2xl border border-[#BFC6CC]/60 bg-white p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-xs font-semibold text-[#607283] block">
                    Alquiler
                  </span>
                  <div className="text-xl font-black text-[#31405F] whitespace-nowrap mt-0.5">
                    200,00 €
                  </div>
                </div>
                <div className="text-right text-[11px] text-[#607283]">
                  <span>Total piso: 600,00 €</span>
                  <br />
                  <span>3 compañeros</span>
                </div>
              </div>

              {/* Bloque 2: Suministros y variables */}
              <div className="rounded-2xl border border-[#BFC6CC]/60 bg-white p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-xs font-semibold text-[#607283] block">
                    Suministros y otros
                  </span>
                  <div className="text-xl font-black text-[#31405F] whitespace-nowrap mt-0.5">
                    {formatEuro(myShare.suppliesShare + myShare.variableShare)}
                  </div>
                </div>
                <div className="text-right text-[11px] text-[#607283]">
                  <span>Luz: {formatEuro(luzTotal / 3)}</span>
                  <br />
                  <span>Otros: {formatEuro((suppliesTotal - luzTotal + otherTotal) / 3)}</span>
                </div>
              </div>
            </div>

            {/* Barra inferior: Total del piso + Acciones principales */}
            <div className="flex items-center justify-between pt-3 border-t border-[#BFC6CC]/40 text-xs text-[#607283] flex-wrap gap-2">
              <div>
                <span className="font-semibold text-[#31405F]">Total piso:</span>{" "}
                <span className="font-extrabold text-[#31405F] whitespace-nowrap">
                  {formatEuro(grandTotal)}
                </span>{" "}
                <span className="text-[11px] text-[#607283]">
                  (600 € alquiler + {formatEuro(grandTotal - 600)} variables)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={isSendingReminder}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#BFC6CC] bg-white px-3 py-1.5 text-xs font-semibold text-[#31405F] hover:bg-[#F4F7F8] active:scale-95 transition-all shadow-2xs"
                >
                  <BellRing className="h-3.5 w-3.5 text-[#FF5722]" />
                  <span>Avisar compañeros</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAddCategory("compras")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#31405F] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#194F6B] active:scale-95 transition-all shadow-2xs"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>+ Registrar Gasto</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* CATEGORÍAS SEGÚN EL ESQUEMA: ALQUILER (FULL) / 2x2 / OTROS (FULL) */}
          {/* ================================================================= */}
          <div className="space-y-2.5">
            {/* 1. ALQUILER (ANCHO COMPLETO, MISMO ESTILO QUE EL RESTO DE SUMINISTROS) */}
            <div
              onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "alquiler" ? null : "alquiler")}
              className={cn(
                "group relative flex flex-col justify-between rounded-3xl border bg-white p-3.5 sm:p-4 shadow-xs transition-all cursor-pointer hover:shadow-xs hover:border-[#31405F]/40",
                selectedCategoryFilter === "alquiler"
                  ? "border-[#31405F] ring-2 ring-[#31405F]/15 shadow-sm"
                  : "border-[#BFC6CC]/70"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#31405F]/10 text-[#31405F] border border-[#31405F]/20 shadow-2xs">
                  <Home className="h-4.5 w-4.5" />
                </div>
                <button
                  type="button"
                  onClick={handleDirectAddRent}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#BFC6CC] bg-[#F4F7F8] text-[#31405F] hover:bg-[#31405F] hover:text-white hover:border-[#31405F] active:scale-95 transition-all shadow-2xs"
                  title="Añadir alquiler directo (600 €)"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>

              <div className="mt-3">
                <span className="text-xs font-bold text-[#31405F] block">
                  Alquiler
                </span>
                <div className="text-lg sm:text-xl font-black text-[#31405F] whitespace-nowrap mt-0.5">
                  600,00 €
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-[#BFC6CC]/30 flex items-center justify-between text-[10px] flex-wrap gap-1">
                <span className="font-semibold text-[#607283]">
                  Tu parte: <strong className="text-[#31405F]">200,00 €</strong>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRentInfoModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#194F6B] hover:text-[#31405F] bg-[#194F6B]/10 hover:bg-[#194F6B]/20 px-2.5 py-1 rounded-xl transition-all shadow-2xs"
                  title="Normas de puntuación del alquiler"
                >
                  <Info className="h-3 w-3 stroke-[2.2]" />
                  <span>Info puntos</span>
                </button>
              </div>
            </div>

            {/* 2. CUADRÍCULA 2x2: LUZ, AGUA, GAS, INTERNET */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* LUZ */}
              <div
                onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "luz" ? null : "luz")}
                className={cn(
                  "group relative flex flex-col justify-between rounded-3xl border bg-white p-3.5 sm:p-4 shadow-xs transition-all cursor-pointer hover:shadow-xs hover:border-amber-400",
                  selectedCategoryFilter === "luz"
                    ? "border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                    : "border-[#BFC6CC]/70"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-2xs">
                    <Zap className="h-4.5 w-4.5" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddCategory("luz");
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#BFC6CC] bg-[#F4F7F8] text-[#31405F] hover:bg-[#31405F] hover:text-white hover:border-[#31405F] active:scale-95 transition-all shadow-2xs"
                    title="Añadir factura de luz"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>

                <div className="mt-3">
                  <span className="text-xs font-bold text-[#31405F] block">
                    Luz
                  </span>
                  <div className="text-lg sm:text-xl font-black text-[#31405F] whitespace-nowrap mt-0.5">
                    {formatEuro(luzTotal)}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#BFC6CC]/30 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-[#607283]">
                    Tu parte: <strong className="text-[#31405F]">{formatEuro(luzTotal / 3)}</strong>
                  </span>
                  {luzExpenses.length > 0 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md">
                      {luzExpenses.length} fact.
                    </span>
                  )}
                </div>
              </div>

              {/* AGUA */}
              <div
                onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "agua" ? null : "agua")}
                className={cn(
                  "group relative flex flex-col justify-between rounded-3xl border bg-white p-3.5 sm:p-4 shadow-xs transition-all cursor-pointer hover:shadow-xs hover:border-sky-400",
                  selectedCategoryFilter === "agua"
                    ? "border-sky-500 ring-2 ring-sky-500/20 shadow-sm"
                    : "border-[#BFC6CC]/70"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 border border-sky-500/20 shadow-2xs">
                    <Droplet className="h-4.5 w-4.5" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddCategory("agua");
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#BFC6CC] bg-[#F4F7F8] text-[#31405F] hover:bg-[#31405F] hover:text-white hover:border-[#31405F] active:scale-95 transition-all shadow-2xs"
                    title="Añadir factura de agua"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>

                <div className="mt-3">
                  <span className="text-xs font-bold text-[#31405F] block">
                    Agua
                  </span>
                  <div className="text-lg sm:text-xl font-black text-[#31405F] whitespace-nowrap mt-0.5">
                    {formatEuro(aguaTotal)}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#BFC6CC]/30 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-[#607283]">
                    Tu parte: <strong className="text-[#31405F]">{formatEuro(aguaTotal / 3)}</strong>
                  </span>
                  {aguaExpenses.length > 0 && (
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded-md">
                      {aguaExpenses.length} fact.
                    </span>
                  )}
                </div>
              </div>

              {/* GAS */}
              <div
                onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "gas" ? null : "gas")}
                className={cn(
                  "group relative flex flex-col justify-between rounded-3xl border bg-white p-3.5 sm:p-4 shadow-xs transition-all cursor-pointer hover:shadow-xs hover:border-orange-400",
                  selectedCategoryFilter === "gas"
                    ? "border-orange-500 ring-2 ring-orange-500/20 shadow-sm"
                    : "border-[#BFC6CC]/70"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-2xs">
                    <Flame className="h-4.5 w-4.5" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddCategory("gas");
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#BFC6CC] bg-[#F4F7F8] text-[#31405F] hover:bg-[#31405F] hover:text-white hover:border-[#31405F] active:scale-95 transition-all shadow-2xs"
                    title="Añadir factura de gas"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>

                <div className="mt-3">
                  <span className="text-xs font-bold text-[#31405F] block">
                    Gas
                  </span>
                  <div className="text-lg sm:text-xl font-black text-[#31405F] whitespace-nowrap mt-0.5">
                    {formatEuro(gasTotal)}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#BFC6CC]/30 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-[#607283]">
                    Tu parte: <strong className="text-[#31405F]">{formatEuro(gasTotal / 3)}</strong>
                  </span>
                  {gasExpenses.length > 0 && (
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded-md">
                      {gasExpenses.length} fact.
                    </span>
                  )}
                </div>
              </div>

              {/* INTERNET */}
              <div
                onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "internet" ? null : "internet")}
                className={cn(
                  "group relative flex flex-col justify-between rounded-3xl border bg-white p-3.5 sm:p-4 shadow-xs transition-all cursor-pointer hover:shadow-xs hover:border-[#094152]/40",
                  selectedCategoryFilter === "internet"
                    ? "border-[#094152] ring-2 ring-[#094152]/20 shadow-sm"
                    : "border-[#BFC6CC]/70"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#094152]/10 text-[#094152] border border-[#094152]/20 shadow-2xs">
                    <Wifi className="h-4.5 w-4.5" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddCategory("internet");
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#BFC6CC] bg-[#F4F7F8] text-[#31405F] hover:bg-[#31405F] hover:text-white hover:border-[#31405F] active:scale-95 transition-all shadow-2xs"
                    title="Añadir factura de internet"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>

                <div className="mt-3">
                  <span className="text-xs font-bold text-[#31405F] block">
                    Internet / Fibra
                  </span>
                  <div className="text-lg sm:text-xl font-black text-[#31405F] whitespace-nowrap mt-0.5">
                    {formatEuro(internetTotal)}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#BFC6CC]/30 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-[#607283]">
                    Tu parte: <strong className="text-[#31405F]">{formatEuro(internetTotal / 3)}</strong>
                  </span>
                  {internetExpenses.length > 0 && (
                    <span className="text-[10px] font-bold text-[#094152] bg-[#094152]/10 px-1.5 py-0.2 rounded-md">
                      {internetExpenses.length} fact.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. OTROS GASTOS (ANCHO COMPLETO) */}
            <div
              onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === "compras" ? null : "compras")}
              className={cn(
                "group relative rounded-3xl border bg-white p-4 sm:p-5 shadow-xs transition-all cursor-pointer",
                selectedCategoryFilter === "compras"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                  : "border-[#BFC6CC]/70 hover:border-emerald-400 hover:shadow-xs"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-2xs">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#31405F]">Otros gastos</h4>
                      {otherExpenses.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 whitespace-nowrap">
                          {otherExpenses.length} gasto{otherExpenses.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#607283] mt-0.5">
                      Compras compartidas, cenas, productos de limpieza...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-base font-black text-[#31405F] whitespace-nowrap block">
                      {formatEuro(otherTotal)}
                    </span>
                    <span className="text-[10px] font-semibold text-[#607283] whitespace-nowrap block">
                      Tu parte: <strong className="text-[#31405F]">{formatEuro(otherTotal / 3)}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddCategory("compras");
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#BFC6CC] bg-[#F4F7F8] text-[#31405F] hover:bg-[#31405F] hover:text-white hover:border-[#31405F] active:scale-95 transition-all shadow-2xs"
                    title="Añadir compra o gasto común"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* FEED UNIFICADO DE FACTURAS Y GASTOS DEL MES */}
          {/* ================================================================= */}
          <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#31405F]">
                  {selectedCategoryFilter
                    ? `Facturas de ${selectedCategoryFilter.toUpperCase()}`
                    : "Movimientos y Facturas del Mes"}
                </h3>
                <span className="text-xs font-semibold text-[#607283]">
                  ({displayedExpenses.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedCategoryFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter(null)}
                    className="text-xs font-bold text-[#194F6B] hover:underline"
                  >
                    Mostrar todos
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openAddCategory(selectedCategoryFilter || "compras")}
                  className="rounded-xl border border-[#BFC6CC] bg-[#F4F7F8] px-2.5 py-1 text-xs font-semibold text-[#31405F] hover:bg-white active:scale-95 transition-all shadow-2xs"
                >
                  + Factura
                </button>
              </div>
            </div>

            {displayedExpenses.length > 0 ? (
              <div className="space-y-2 pt-1">
                {displayedExpenses.map((exp) => {
                  const isMyExpense = exp.paid_by === currentUser?.id;
                  const payer = getFlatmate(exp.paid_by);
                  const myShareAmount = exp.amount / 3;

                  return (
                    <div
                      key={exp.id}
                      className="group flex items-center justify-between rounded-2xl border border-[#BFC6CC]/50 bg-[#F4F7F8]/40 p-3.5 transition-all hover:bg-white hover:border-[#194F6B]/30 hover:shadow-2xs gap-3"
                    >
                      {/* Icono + Información */}
                      <div className="flex items-center gap-3 min-w-0">
                        <ExpenseCategoryIcon category={exp.category} size="md" />

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-[#31405F] truncate">
                              {exp.description}
                            </span>
                            <span className="text-[10px] text-[#607283]">· {exp.date}</span>
                          </div>

                          {/* Quién pagó */}
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#607283]">
                            <span>Pagado por</span>
                            <div className="flex items-center gap-1">
                              <span
                                className={cn(
                                  "inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white shadow-2xs",
                                  payer.color
                                )}
                              >
                                {payer.name.charAt(0)}
                              </span>
                              <span className="font-semibold text-[#31405F]">
                                {isMyExpense ? "ti" : payer.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Importe + Insignia personal + Borrado */}
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div>
                          <span className="text-sm font-black text-[#31405F] whitespace-nowrap block">
                            {formatEuro(exp.amount)}
                          </span>

                          {isMyExpense ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 whitespace-nowrap">
                              <ArrowDownLeft className="h-3 w-3" />
                              Te deben {formatEuro((exp.amount / 3) * 2)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#607283] whitespace-nowrap">
                              <ArrowUpRight className="h-3 w-3" />
                              Tu parte: {formatEuro(myShareAmount)}
                            </span>
                          )}
                        </div>

                        {(isAdmin || isMyExpense) && (
                          <button
                            type="button"
                            onClick={() => void removeExpense(exp.id)}
                            className="text-[#607283] hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors opacity-80 group-hover:opacity-100"
                            title="Eliminar factura"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4F7F8] text-[#607283] border border-[#BFC6CC]/40">
                  <Wallet className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-[#31405F]">
                  {selectedCategoryFilter
                    ? `No hay facturas de ${selectedCategoryFilter} este mes`
                    : "No hay facturas ni compras registradas en este mes"}
                </p>
                <button
                  type="button"
                  onClick={() => openAddCategory(selectedCategoryFilter || "compras")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#31405F] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#194F6B] transition-all shadow-2xs mt-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Registrar factura</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: DEUDAS Y AJUSTES CON FLECHA */}
      {/* ========================================================================= */}
      {activeTab === "deudas" && (
        <div className="animate-in fade-in-50 duration-150">
          <DebtsView
            expenses={expenses}
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

      {/* Modal de Detalle de Alquiler de Compañeros */}
      <FlatmatesRentModal
        isOpen={isRentModalOpen}
        onClose={() => setIsRentModalOpen(false)}
        monthName={safeRentSummary.monthName}
        totalRent={safeRentSummary.totalRent}
        paidCount={safeRentSummary.paidCount}
        flatmateStatuses={safeRentSummary.flatmateStatuses}
        currentUserId={currentUser?.id}
        onToggleRentPaid={toggleRentPaid}
      />

      {/* Modal explicativo de normas de puntos del alquiler */}
      {isRentInfoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-50 duration-150"
          onClick={() => setIsRentInfoModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-[#BFC6CC]/70 bg-white p-5 sm:p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 border border-amber-500/20">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#31405F]">
                    Puntos del Alquiler
                  </h3>
                  <p className="text-[11px] text-[#607283]">
                    Reglas de pago puntual
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRentInfoModalOpen(false)}
                className="rounded-xl p-1 text-[#607283] hover:bg-[#F4F7F8] hover:text-[#31405F] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#31405F]">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-3 flex items-start gap-2.5">
                <span className="text-emerald-700 font-extrabold text-sm mt-0.5">✓</span>
                <div>
                  <span className="font-bold text-emerald-800">Días 1 al 5 del mes:</span>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Si pagas tu parte dentro de los primeros 5 días, ganas <strong>+1 punto</strong> en el ranking de convivencia.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-500/30 bg-rose-50/50 p-3 flex items-start gap-2.5">
                <span className="text-rose-600 font-extrabold text-sm mt-0.5">✕</span>
                <div>
                  <span className="font-bold text-rose-800">Después del día 5:</span>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Si te retrasas y pagas después del día 5, se te penaliza con <strong>-1 punto</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRentInfoModalOpen(false)}
              className="w-full rounded-xl bg-[#31405F] py-2.5 text-xs font-bold text-white hover:bg-[#194F6B] transition-all shadow-2xs"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
