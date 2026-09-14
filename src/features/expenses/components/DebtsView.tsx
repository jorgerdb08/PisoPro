"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { DebtTransfer, ExpenseItem } from "../calculations";
import { FLATMATES } from "@/lib/constants";
import {
  ArrowRight,
  CheckCircle2,
  Scale,
  Check,
  RotateCcw,
  Home,
  Zap,
  Droplet,
  Flame,
  Wifi,
  ShoppingCart,
  Receipt,
  History,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ItemizedTransfer {
  id: string;
  expenseId: string;
  concept: string;
  category: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  date: string;
}

export interface SettledTransferRecord extends ItemizedTransfer {
  settledAt: string;
}

const STORAGE_KEY = "pisopro_settled_itemized_debts_v1";

interface DebtsViewProps {
  expenses?: ExpenseItem[];
  pendingTransfers?: DebtTransfer[];
  netBalances?: Record<string, number>;
  onSettleTransfer?: (transfer: DebtTransfer) => Promise<unknown>;
}

export function DebtsView({
  expenses = [],
  onSettleTransfer,
}: DebtsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"pendientes" | "historial">("pendientes");
  const [settledMap, setSettledMap] = useState<Record<string, SettledTransferRecord>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [justSettledId, setJustSettledId] = useState<string | null>(null);

  // Cargar estado de transferencias saldadas de localStorage de forma segura
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSettledMap(JSON.parse(raw));
      }
    } catch (e) {
      console.error("Error cargando historial de transferencias:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveSettledMap = (updated: Record<string, SettledTransferRecord>) => {
    setSettledMap(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Error guardando historial de transferencias:", e);
    }
  };

  const formatEuro = (val: number) =>
    (val || 0).toFixed(2).replace(".", ",") + " €";

  const getFlatmate = (id: string) =>
    FLATMATES.find((f) => f.id === id) || {
      id,
      name: "Compañero",
      avatar: "👤",
      color: "bg-[#31405F] text-white",
    };

  const getCategoryVisual = (category?: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("alquiler") || cat.includes("rent")) {
      return { icon: Home, label: "Alquiler", colorClass: "bg-[#31405F]/10 text-[#31405F] border-[#31405F]/20" };
    }
    if (cat.includes("luz") || cat.includes("utilit")) {
      return { icon: Zap, label: "Luz", colorClass: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
    }
    if (cat.includes("agua") || cat.includes("water")) {
      return { icon: Droplet, label: "Agua", colorClass: "bg-sky-500/10 text-sky-600 border-sky-500/20" };
    }
    if (cat.includes("gas")) {
      return { icon: Flame, label: "Gas", colorClass: "bg-orange-500/10 text-orange-600 border-orange-500/20" };
    }
    if (cat.includes("internet") || cat.includes("wifi")) {
      return { icon: Wifi, label: "Wifi", colorClass: "bg-[#094152]/10 text-[#094152] border-[#094152]/20" };
    }
    if (cat.includes("compra") || cat.includes("shopping")) {
      return { icon: ShoppingCart, label: "Compras", colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
    }
    return { icon: Receipt, label: "Gasto", colorClass: "bg-slate-500/10 text-slate-700 border-slate-500/20" };
  };

  // Generar lista de transferencias separadas por cada gasto individual
  const allItemizedTransfers = useMemo<ItemizedTransfer[]>(() => {
    const list: ItemizedTransfer[] = [];

    (expenses || []).forEach((expense) => {
      // Omitir liquidaciones pasadas en la lista de deudas generadas
      if (expense.category === "settlement") return;

      const payerId = expense.paid_by;
      const totalAmount = Number(expense.amount) || 0;
      if (totalAmount <= 0) return;

      if (expense.participants && expense.participants.length > 0) {
        expense.participants.forEach((p) => {
          if (p.user_id !== payerId) {
            const share = Number(p.share_amount) || 0;
            if (share > 0) {
              list.push({
                id: `${expense.id}_${p.user_id}`,
                expenseId: expense.id,
                concept: expense.description || "Gasto compartido",
                category: expense.category || "other",
                fromUserId: p.user_id,
                toUserId: payerId,
                amount: share,
                date: expense.date || "",
              });
            }
          }
        });
      } else {
        // Reparto equitativo entre todos los compañeros del piso
        const share = Math.round((totalAmount / FLATMATES.length) * 100) / 100;
        FLATMATES.forEach((f) => {
          if (f.id !== payerId) {
            list.push({
              id: `${expense.id}_${f.id}`,
              expenseId: expense.id,
              concept: expense.description || "Gasto compartido",
              category: expense.category || "other",
              fromUserId: f.id,
              toUserId: payerId,
              amount: share,
              date: expense.date || "",
            });
          }
        });
      }
    });

    // Ordenar por fecha descendente
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses]);

  // Filtrar pendientes y saldadas
  const pendingTransfers = useMemo(() => {
    if (!isLoaded) return allItemizedTransfers;
    return allItemizedTransfers.filter((t) => !settledMap[t.id]);
  }, [allItemizedTransfers, settledMap, isLoaded]);

  const settledTransfers = useMemo(() => {
    return Object.values(settledMap).sort((a, b) => (b.settledAt || "").localeCompare(a.settledAt || ""));
  }, [settledMap]);

  // Marcar como pagado
  const handleMarkAsPaid = async (item: ItemizedTransfer) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })} ${now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;

    setJustSettledId(item.id);
    setTimeout(() => {
      const updated = {
        ...settledMap,
        [item.id]: {
          ...item,
          settledAt: formattedDate,
        },
      };
      saveSettledMap(updated);
      setJustSettledId(null);
    }, 400);

    if (onSettleTransfer) {
      void onSettleTransfer({
        fromUserId: item.fromUserId,
        toUserId: item.toUserId,
        amount: item.amount,
      });
    }
  };

  // Deshacer y devolver a pendientes
  const handleUndo = (id: string) => {
    const updated = { ...settledMap };
    delete updated[id];
    saveSettledMap(updated);
  };

  return (
    <div className="space-y-4">
      {/* Selector de sub-pestañas: Pendientes / Historial */}
      <div className="flex rounded-2xl bg-[#F4F7F8] p-1 border border-[#BFC6CC]/60 max-w-sm mx-auto w-full">
        <button
          type="button"
          onClick={() => setActiveSubTab("pendientes")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all relative",
            activeSubTab === "pendientes"
              ? "bg-white text-[#31405F] shadow-2xs"
              : "text-[#607283] hover:text-[#31405F]"
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Pendientes</span>
          {pendingTransfers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-extrabold leading-none">
              {pendingTransfers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("historial")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all",
            activeSubTab === "historial"
              ? "bg-white text-[#31405F] shadow-2xs"
              : "text-[#607283] hover:text-[#31405F]"
          )}
        >
          <History className="h-3.5 w-3.5" />
          <span>Historial</span>
          {settledTransfers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold leading-none">
              {settledTransfers.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 1: TRANSFERENCIAS PENDIENTES (DESGLOSADAS POR CONCEPTO) */}
      {/* ========================================================================= */}
      {activeSubTab === "pendientes" && (
        <div className="space-y-3 animate-in fade-in-50 duration-150">
          {pendingTransfers.length > 0 ? (
            pendingTransfers.map((item) => {
              const from = getFlatmate(item.fromUserId);
              const to = getFlatmate(item.toUserId);
              const visual = getCategoryVisual(item.category);
              const IconComp = visual.icon;
              const isSettling = justSettledId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-3xl border border-[#BFC6CC]/70 bg-white p-4 sm:p-5 shadow-xs transition-all space-y-3 hover:border-[#194F6B]/40",
                    isSettling && "opacity-40 scale-98 transition-all duration-300"
                  )}
                >
                  {/* Cabecera del gasto individual */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border shadow-2xs",
                          visual.colorClass
                        )}
                      >
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#31405F] block truncate">
                          {item.concept}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-[#607283]">
                          <span className="capitalize">{visual.label}</span>
                          {item.date && <span>· {item.date}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-[#31405F]">
                        {formatEuro(item.amount)}
                      </span>
                    </div>
                  </div>

                  {/* FLECHA VISUAL: Deudor -> Importe -> Acreedor */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#BFC6CC]/30 flex-wrap sm:flex-nowrap">
                    {/* Persona que debe pagar */}
                    <div className="flex items-center gap-2.5 min-w-[110px]">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs text-white",
                          from.color || "bg-[#31405F]"
                        )}
                      >
                        {from.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#31405F] block">
                          {from.name}
                        </span>
                        <span className="text-[10px] font-semibold text-rose-600">
                          Debe pagar
                        </span>
                      </div>
                    </div>

                    {/* Flecha conectora central */}
                    <div className="flex-1 flex items-center justify-center min-w-[140px] px-2">
                      <div className="relative flex items-center w-full max-w-[200px]">
                        <div className="w-full h-0.5 bg-[#BFC6CC]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex items-center gap-1 rounded-full border border-[#BFC6CC] bg-[#F4F7F8] px-2.5 py-0.5 shadow-2xs">
                            <span className="text-[11px] font-black text-[#31405F]">
                              {formatEuro(item.amount)}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-[#094152] shrink-0 stroke-[2.5]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Persona que recibe */}
                    <div className="flex items-center gap-2.5 min-w-[110px] justify-end">
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#31405F] block">
                          {to.name}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600">
                          Recibe
                        </span>
                      </div>
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs text-white",
                          to.color || "bg-[#094152]"
                        )}
                      >
                        {to.name.charAt(0)}
                      </div>
                    </div>
                  </div>

                  {/* Pie de acción: Marcar como pagado */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#BFC6CC]/30">
                    <span className="text-[11px] text-[#607283]">
                      {from.name} le paga a {to.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => void handleMarkAsPaid(item)}
                      disabled={isSettling}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-[#31405F] text-white hover:bg-[#194F6B] active:scale-95 transition-all shadow-2xs border border-[#31405F]"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Marcar como pagado</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-50/30 p-8 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-2xs">
                <CheckCircle2 className="h-6 w-6 stroke-[2.2]" />
              </div>
              <h4 className="text-sm font-bold text-[#31405F]">
                ¡No hay transferencias pendientes!
              </h4>
              <p className="text-xs text-[#607283] max-w-sm mx-auto">
                Todas las cuentas y gastos individuales están saldados al día.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 2: HISTORIAL DE TRANSFERENCIAS SALDADAS */}
      {/* ========================================================================= */}
      {activeSubTab === "historial" && (
        <div className="space-y-3 animate-in fade-in-50 duration-150">
          {settledTransfers.length > 0 ? (
            settledTransfers.map((item) => {
              const from = getFlatmate(item.fromUserId);
              const to = getFlatmate(item.toUserId);
              const visual = getCategoryVisual(item.category);
              const IconComp = visual.icon;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/20 to-white p-4 shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-2xs",
                          visual.colorClass
                        )}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#31405F] block truncate">
                          {item.concept}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>Saldado {item.settledAt}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-lg">
                        {formatEuro(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUndo(item.id)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#607283] hover:text-[#31405F] hover:bg-[#F4F7F8] p-1.5 rounded-lg transition-colors border border-[#BFC6CC]/60"
                        title="Deshacer y volver a marcar como pendiente"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span className="hidden sm:inline">Deshacer</span>
                      </button>
                    </div>
                  </div>

                  {/* Resumen quién pagó a quién */}
                  <div className="flex items-center justify-between text-xs text-[#31405F] pt-2 border-t border-emerald-100/60 bg-emerald-50/40 -mx-4 -mb-4 px-4 py-2 rounded-b-3xl">
                    <span className="text-[11px] font-medium text-[#607283]">
                      <strong className="text-[#31405F]">{from.name}</strong> transfirió a <strong className="text-[#31405F]">{to.name}</strong>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">
                      ✓ Pagado
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-8 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F7F8] text-[#607283] shadow-2xs">
                <History className="h-6 w-6 stroke-[2]" />
              </div>
              <h4 className="text-sm font-bold text-[#31405F]">
                Historial vacío
              </h4>
              <p className="text-xs text-[#607283] max-w-sm mx-auto">
                A medida que marques las transferencias individuales como pagadas, quedarán guardadas aquí como historial.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
