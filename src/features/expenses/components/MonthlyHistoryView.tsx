"use client";

import React, { useMemo } from "react";
import type { MonthHistoryItem, ExpenseItem } from "../calculations";
import { ExpenseCategoryIcon } from "./ExpenseCategoryIcon";
import { ExpenseCard } from "./ExpenseCard";
import { cn } from "@/lib/utils";
import { FLATMATES } from "@/lib/constants";
import { Check } from "lucide-react";

interface MonthlyHistoryViewProps {
  historyItems: MonthHistoryItem[];
  selectedMonth: string;
  onSelectMonth: (monthStr: string) => void;
  expenses: ExpenseItem[];
  currentUserId?: string;
  isAdmin: boolean;
  onDeleteExpense: (id: string) => Promise<unknown>;
  settledDebtKeys?: Set<string>;
}

export function MonthlyHistoryView({
  historyItems,
  selectedMonth,
  onSelectMonth,
  expenses,
  currentUserId,
  isAdmin,
  onDeleteExpense,
  settledDebtKeys,
}: MonthlyHistoryViewProps) {
  const formatEuro = (val: number) =>
    (val || 0).toFixed(2).replace(".", ",") + " €";

  const fallbackItem: MonthHistoryItem = {
    monthStr: selectedMonth || "2026-09",
    displayName: "Septiembre 2026",
    rentTotal: 600,
    suppliesTotal: 0,
    variableTotal: 0,
    grandTotal: 600,
    categoryBreakdown: { alquiler: 600 },
    expensesCount: 0,
  };

  const selectedItem =
    historyItems.find((h) => h.monthStr === selectedMonth) ||
    historyItems[0] ||
    fallbackItem;

  const maxMonthSpend = Math.max(
    ...historyItems.map((h) => h.grandTotal),
    700
  );

  const selectedMonthExpenses = expenses.filter(
    (e) => e.date && e.date.substring(0, 7) === selectedMonth
  );

  // Pagos e historial de gastos del usuario actual en el mes seleccionado
  const { myPaidItems, totalPaidByMe } = useMemo(() => {
    if (!currentUserId) return { myPaidItems: [], totalPaidByMe: 0 };

    const items: Array<{
      id: string;
      concept: string;
      category: string;
      amount: number;
      status: "paid" | "pending" | "paid_by_me";
      date: string;
    }> = [];

    // Map local de debts saldadas
    let localMap: Record<string, any> = {};
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pisopro_settled_itemized_debts_v1");
        if (raw) localMap = JSON.parse(raw);
      } catch {
        // ignore
      }
    }

    // 1. Alquiler del usuario
    const rentKey = `rent_${selectedMonth}_${currentUserId}`;
    const isRentSettled =
      settledDebtKeys?.has(rentKey) || !!localMap[rentKey];
    const rentSettledDate = localMap[rentKey]?.settledAt || "Mes en curso";

    items.push({
      id: rentKey,
      concept: `Cuota de Alquiler ${selectedItem?.displayName || selectedMonth}`,
      category: "alquiler",
      amount: 200,
      status: isRentSettled ? "paid" : "pending",
      date: isRentSettled ? rentSettledDate : `${selectedMonth}-01`,
    });

    // 2. Gastos registrados en el mes
    selectedMonthExpenses.forEach((e) => {
      if (e.category === "settlement") return;
      const cat = (e.category || "").toLowerCase();
      if (cat === "alquiler" || cat === "rent") return;

      const payerId = e.paid_by;
      if (payerId === currentUserId) {
        // Gasto pagado/adelantado por el usuario
        items.push({
          id: `paid_${e.id}`,
          concept: `${e.description || "Gasto"}`,
          category: e.category || "other",
          amount: Number(e.amount) || 0,
          status: "paid_by_me",
          date: e.date || "Fecha",
        });
      } else {
        // Cuota que el usuario debe aportar
        let share = 0;
        if (e.participants && e.participants.length > 0) {
          const p = e.participants.find((part) => part.user_id === currentUserId);
          if (p) share = Number(p.share_amount) || 0;
        } else {
          share = Math.round((Number(e.amount) / FLATMATES.length) * 100) / 100;
        }

        if (share > 0) {
          const debtKey = `${e.id}_${currentUserId}`;
          const isSettled =
            settledDebtKeys?.has(debtKey) || !!localMap[debtKey];
          const settledDate = localMap[debtKey]?.settledAt || e.date || "Fecha";

          items.push({
            id: debtKey,
            concept: `Tu parte: ${e.description || "Gasto común"}`,
            category: e.category || "other",
            amount: share,
            status: isSettled ? "paid" : "pending",
            date: settledDate,
          });
        }
      }
    });

    // 3. Otros items de localMap que puedan corresponder al mes
    Object.values(localMap).forEach((loc: any) => {
      if (
        loc.fromUserId === currentUserId &&
        loc.date &&
        loc.date.startsWith(selectedMonth) &&
        !items.some((i) => i.id === loc.id)
      ) {
        items.push({
          id: loc.id,
          concept: loc.concept || "Gasto saldado",
          category: loc.category || "other",
          amount: Number(loc.amount) || 0,
          status: "paid",
          date: loc.settledAt || "Reciente",
        });
      }
    });

    const totalPaid = items
      .filter((i) => i.status === "paid" || i.status === "paid_by_me")
      .reduce((sum, i) => sum + i.amount, 0);

    return {
      myPaidItems: items,
      totalPaidByMe: Math.round(totalPaid * 100) / 100,
    };
  }, [currentUserId, selectedMonth, settledDebtKeys, selectedMonthExpenses, selectedItem]);

  return (
    <div className="space-y-4">
      {/* Header con Navegación de Meses */}
      <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#607283]">
              Histórico Mensual
            </span>
            <h3 className="text-base font-bold text-[#31405F]">
              {selectedItem?.displayName || "Evolución"}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="rounded-xl border border-[#BFC6CC]/80 bg-[#F4F7F8] px-3 py-1.5 text-xs font-bold text-[#31405F] focus:outline-hidden focus:ring-1 focus:ring-[#31405F]"
            >
              {historyItems.map((h) => (
                <option key={h.monthStr} value={h.monthStr}>
                  {h.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Gráfico de Barras Comparativo de los Últimos Meses */}
        <div className="space-y-2 pt-1 border-t border-[#BFC6CC]/30">
          <span className="text-[11px] font-medium text-[#607283]">
            Comparativa de los últimos meses (Alquiler 600€ + Suministros + Variables)
          </span>

          <div className="grid grid-cols-6 gap-2 pt-2 items-end h-28">
            {historyItems
              .slice()
              .reverse()
              .map((item) => {
                const heightPercent = Math.max(
                  Math.round((item.grandTotal / maxMonthSpend) * 100),
                  20
                );
                const isSelected = item.monthStr === selectedMonth;

                return (
                  <div
                    key={item.monthStr}
                    onClick={() => onSelectMonth(item.monthStr)}
                    className="flex flex-col items-center gap-1 cursor-pointer group h-full justify-end"
                  >
                    <span className="text-[9px] font-semibold text-[#607283] truncate group-hover:text-[#31405F]">
                      {formatEuro(item.grandTotal)}
                    </span>

                    <div className="w-full rounded-t-lg bg-[#F4F7F8] border border-[#BFC6CC]/40 flex flex-col justify-end overflow-hidden h-20">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={cn(
                          "w-full rounded-t-md transition-all duration-300",
                          isSelected
                            ? "bg-[#31405F] shadow-xs"
                            : "bg-[#094152]/40 group-hover:bg-[#094152]/60"
                        )}
                      />
                    </div>

                    <span
                      className={cn(
                        "text-[10px] truncate max-w-full font-medium",
                        isSelected ? "text-[#31405F] font-bold" : "text-[#8C9AA6]"
                      )}
                    >
                      {item.displayName.split(" ")[0]!.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Resumen del Mes Seleccionado */}
      {selectedItem && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#BFC6CC]/60 bg-white p-3.5 shadow-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#607283] block">
              Gasto Total {selectedItem.displayName}
            </span>
            <span className="text-xl font-extrabold text-[#31405F] tracking-tight">
              {formatEuro(selectedItem.grandTotal)}
            </span>
            <p className="text-[11px] text-[#607283] mt-0.5">
              Alquiler 600 € + {formatEuro(selectedItem.suppliesTotal + selectedItem.variableTotal)} variables
            </p>
          </div>

          <div className="rounded-2xl border border-[#BFC6CC]/60 bg-white p-3.5 shadow-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#607283] block">
              Cuota Media por Inquilino
            </span>
            <span className="text-xl font-extrabold text-[#094152] tracking-tight">
              {formatEuro(selectedItem.grandTotal / 3)}
            </span>
            <p className="text-[11px] text-[#607283] mt-0.5">
              200 € alquiler + cuota suministros
            </p>
          </div>
        </div>
      )}

      {/* Desglose por Categorías del Mes Seleccionado */}
      {selectedItem && (
        <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#31405F]">
            Desglose por Categorías en {selectedItem.displayName}
          </h4>

          <div className="space-y-2">
            {/* Alquiler fijo */}
            <div className="flex items-center justify-between rounded-xl border border-[#BFC6CC]/30 bg-[#F4F7F8]/50 p-2.5">
              <div className="flex items-center gap-2.5">
                <ExpenseCategoryIcon category="alquiler" size="sm" />
                <div>
                  <span className="text-xs font-bold text-[#31405F]">
                    Alquiler del Piso
                  </span>
                  <span className="text-[10px] text-[#607283] block">
                    Fijo mensual (200 € x 3)
                  </span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#31405F]">
                {formatEuro(600)}
              </span>
            </div>

            {/* Resto de categorías */}
            {Object.entries(selectedItem.categoryBreakdown)
              .filter(([cat]) => cat !== "alquiler")
              .map(([cat, amount]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between rounded-xl border border-[#BFC6CC]/30 bg-white p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <ExpenseCategoryIcon category={cat} size="sm" />
                    <div>
                      <span className="text-xs font-bold text-[#31405F] capitalize">
                        {cat}
                      </span>
                      <span className="text-[10px] text-[#607283] block">
                        Repartido entre compañeros
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#31405F]">
                    {formatEuro(amount)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Historial de Pagos del Usuario en este Mes */}
      <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#607283]">
              Historial de Pagos
            </span>
            <h4 className="text-xs font-bold text-[#31405F]">
              Tus Pagos en {selectedItem?.displayName}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 block">
              {formatEuro(totalPaidByMe)} pagado
            </span>
          </div>
        </div>

        {myPaidItems.length > 0 ? (
          <div className="space-y-2">
            {myPaidItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-[#BFC6CC]/30 bg-white p-2.5 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ExpenseCategoryIcon category={item.category} size="sm" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#31405F] block truncate">
                      {item.concept}
                    </span>
                    <span className="text-[10px] text-[#607283] block">
                      {item.status === "paid_by_me"
                        ? "Factura adelantada por ti"
                        : item.status === "paid"
                        ? `✓ Saldado (${item.date})`
                        : `Pendiente (${item.date})`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black text-[#31405F]">
                    {formatEuro(item.amount)}
                  </span>
                  {item.status === "paid" || item.status === "paid_by_me" ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                      ✓ Pagado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                      Pendiente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#BFC6CC] p-4 text-center text-xs text-[#607283] bg-[#F4F7F8]/40">
            No constan pagos registrados a tu nombre en este mes.
          </div>
        )}
      </div>

      {/* Tickets y Movimientos del Mes Seleccionado */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#31405F]">
            Tickets Registrados en {selectedItem?.displayName} ({selectedMonthExpenses.length})
          </h4>
        </div>

        {selectedMonthExpenses.length > 0 ? (
          selectedMonthExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onDelete={onDeleteExpense}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#BFC6CC] p-6 text-center text-xs text-[#607283] bg-white">
            No se registraron facturas adicionales en este mes además del alquiler fijo de 600 €.
          </div>
        )}
      </div>
    </div>
  );
}
