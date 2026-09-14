"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { ExpenseItem } from "../calculations";
import { FLATMATES, DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import { rentService } from "@/services/rentService";
import { notificationService } from "@/features/notifications/notificationService";
import { expensesService } from "@/services/expensesService";
import {
  ArrowRight,
  CheckCircle2,
  Check,
  CheckCheck,
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
  Users,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ItemizedTransfer {
  id: string; // debtKey único
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
  settlementId?: string; // ID en la tabla expenses de Supabase
}

const STORAGE_KEY = "pisopro_settled_itemized_debts_v1";
const CLAIM_STORAGE_KEY = "pisopro_claimed_payment_debts_v1";

interface DebtsViewProps {
  expenses?: ExpenseItem[];
  selectedMonth?: string;
  currentUserId?: string;
  pendingTransfers?: unknown[];
  netBalances?: Record<string, number>;
  onSettleTransfer?: (transfer: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    debtKey?: string;
    concept?: string;
  }) => Promise<unknown>;
  onDeleteSettlement?: (settlementExpenseId: string) => Promise<unknown>;
}

export function DebtsView({
  expenses = [],
  selectedMonth = "2026-09",
  currentUserId,
  onSettleTransfer,
  onDeleteSettlement,
}: DebtsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"pendientes" | "historial">("pendientes");
  const [localSettledMap, setLocalSettledMap] = useState<Record<string, SettledTransferRecord>>({});
  const [localClaimedMap, setLocalClaimedMap] = useState<Record<string, { debtorId: string; claimedAt: string }>>({});
  const [justSettledId, setJustSettledId] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [rentFeedback, setRentFeedback] = useState<{
    isOnTime: boolean;
    message: string;
  } | null>(null);

  const triggerToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3500);
  };

  // 1. Cargar almacenamiento local para redundancia inmediata y offline
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLocalSettledMap(JSON.parse(raw));
    } catch {
      // ignore
    }
    try {
      const rawClaims = localStorage.getItem(CLAIM_STORAGE_KEY);
      if (rawClaims) setLocalClaimedMap(JSON.parse(rawClaims));
    } catch {
      // ignore
    }
  }, []);

  const saveLocalSettledMap = (updated: Record<string, SettledTransferRecord>) => {
    setLocalSettledMap(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const saveLocalClaimedMap = (updated: Record<string, { debtorId: string; claimedAt: string }>) => {
    setLocalClaimedMap(updated);
    try {
      localStorage.setItem(CLAIM_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const formatEuro = (val: number) =>
    (val || 0).toFixed(2).replace(".", ",") + " €";

  const getFlatmate = (id: string) => {
    if (id === "landlord" || id === "casero") {
      return {
        id: "landlord",
        name: "Casero / Piso",
        avatar: "🏠",
        color: "bg-[#194F6B] text-white",
      };
    }
    return (
      FLATMATES.find((f) => f.id === id) || {
        id,
        name: "Compañero",
        avatar: "👤",
        color: "bg-[#31405F] text-white",
      }
    );
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

  // 2. Liquidaciones reales sincronizadas en Supabase
  const supabaseSettledMap = useMemo(() => {
    const map: Record<string, { settlementId: string; settledAt: string }> = {};
    expenses.forEach((e) => {
      if (e.category === "settlement" && e.notes?.startsWith("settled_debt:")) {
        const debtKey = e.notes.replace("settled_debt:", "").trim();
        if (debtKey) {
          map[debtKey] = {
            settlementId: e.id,
            settledAt: e.date || (e.created_at ? e.created_at.split("T")[0]! : ""),
          };
        }
      }
    });
    return map;
  }, [expenses]);

  // 3. Generar la lista completa de transferencias individuales
  const allItemizedTransfers = useMemo<ItemizedTransfer[]>(() => {
    const list: ItemizedTransfer[] = [];

    const jorge = FLATMATES.find((f) => f.name === "Jorge") || FLATMATES[0]!;
    const samuel = FLATMATES.find((f) => f.name === "Samuel") || FLATMATES[1]!;
    const david = FLATMATES.find((f) => f.name === "David") || FLATMATES[2]!;

    // A) Cuotas de Alquiler del mes (Samuel y David le transfieren sus 200 € a Jorge)
    // 1. Samuel le transfiere sus 200 € a Jorge
    list.push({
      id: `rent_${selectedMonth}_${samuel.id}`,
      expenseId: `rent_${selectedMonth}`,
      concept: `Alquiler ${selectedMonth}`,
      category: "alquiler",
      fromUserId: samuel.id,
      toUserId: jorge.id,
      amount: 200,
      date: `${selectedMonth}-01`,
    });

    // 2. David le transfiere sus 200 € a Jorge
    list.push({
      id: `rent_${selectedMonth}_${david.id}`,
      expenseId: `rent_${selectedMonth}`,
      concept: `Alquiler ${selectedMonth}`,
      category: "alquiler",
      fromUserId: david.id,
      toUserId: jorge.id,
      amount: 200,
      date: `${selectedMonth}-01`,
    });

    // 3. Cuota de alquiler propia de Jorge (para reflejar su pago en el historial)
    list.push({
      id: `rent_${selectedMonth}_${jorge.id}`,
      expenseId: `rent_${selectedMonth}`,
      concept: `Alquiler ${selectedMonth} (Tu parte)`,
      category: "alquiler",
      fromUserId: jorge.id,
      toUserId: jorge.id,
      amount: 200,
      date: `${selectedMonth}-01`,
    });

    // B) Gastos y facturas de la tabla expenses (filtrados del mes o generales, excluyendo liquidaciones)
    expenses.forEach((expense) => {
      if (expense.category === "settlement") return;
      const cat = (expense.category || "").toLowerCase();
      if (cat === "alquiler" || cat === "rent") return; // Ya cubierto arriba

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

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, selectedMonth]);

  // Claims de pago sincronizados desde Supabase
  const supabaseClaimedMap = useMemo(() => {
    const map: Record<string, { debtorId: string; claimedAt: string }> = {};
    expenses.forEach((e) => {
      if (e.category === "payment_claim" && e.notes?.startsWith("claimed_debt:")) {
        const debtKey = e.notes.replace("claimed_debt:", "").trim();
        if (debtKey) {
          map[debtKey] = {
            debtorId: e.paid_by,
            claimedAt: e.date || (e.created_at ? e.created_at.split("T")[0]! : ""),
          };
        }
      }
    });
    return map;
  }, [expenses]);

  const isDebtClaimed = (item: ItemizedTransfer) => {
    return !!supabaseClaimedMap[item.id] || !!localClaimedMap[item.id];
  };

  // Función para comprobar si una deuda está saldada definitivamente (en Supabase o localmente)
  const isDebtSettled = (item: ItemizedTransfer) => {
    return !!supabaseSettledMap[item.id] || !!localSettledMap[item.id];
  };

  // 4. Lista de pendientes: cada uno ve solo las transferencias donde esté involucrado (excluyendo pagos a sí mismo)
  const pendingList = useMemo(() => {
    return allItemizedTransfers.filter((item) => {
      if (isDebtSettled(item)) return false;
      if (item.fromUserId === item.toUserId) return false;
      if (!currentUserId) return true;
      return item.fromUserId === currentUserId || item.toUserId === currentUserId;
    });
  }, [allItemizedTransfers, supabaseSettledMap, localSettledMap, currentUserId]);

  // 5. Historial de saldadas (común para todos los compañeros del piso)
  const settledList = useMemo<SettledTransferRecord[]>(() => {
    const listMap = new Map<string, SettledTransferRecord>();

    allItemizedTransfers.forEach((item) => {
      if (isDebtSettled(item)) {
        const sb = supabaseSettledMap[item.id];
        const loc = localSettledMap[item.id];
        listMap.set(item.id, {
          ...item,
          settledAt: sb?.settledAt || loc?.settledAt || "Reciente",
          settlementId: sb?.settlementId || loc?.settlementId,
        });
      }
    });

    // Asegurar que cualquier registro presente en localSettledMap también aparezca
    Object.values(localSettledMap).forEach((locItem) => {
      if (!listMap.has(locItem.id)) {
        listMap.set(locItem.id, locItem);
      }
    });

    return Array.from(listMap.values());
  }, [allItemizedTransfers, supabaseSettledMap, localSettledMap]);

  // Enviar recordatorio de que falta por pagar
  const handleSendDebtReminder = async (item: ItemizedTransfer) => {
    const from = getFlatmate(item.fromUserId);
    const to = getFlatmate(item.toUserId);
    const sender = currentUserId ? getFlatmate(currentUserId) : to;

    try {
      await notificationService.sendDebtReminderNotice({
        senderName: sender.name,
        senderUserId: sender.id,
        debtorName: from.name,
        debtorUserId: item.fromUserId,
        amount: item.amount,
        concept: item.concept,
      });
      triggerToast(`🔔 Recordatorio enviado a ${from.name}: ${formatEuro(item.amount)}`);
    } catch (err) {
      console.error("Error enviando recordatorio:", err);
      triggerToast(`🔔 Recordatorio registrado para ${from.name}`);
    }
  };

  // 1. El deudor marca que ha pagado: se notifica al acreedor y NO desaparece de la lista
  const handleDebtorMarkPaid = async (item: ItemizedTransfer) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })} ${now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
    const from = getFlatmate(item.fromUserId);
    const to = getFlatmate(item.toUserId);

    // Guardar aviso de pago en local
    const updatedClaims = {
      ...localClaimedMap,
      [item.id]: {
        debtorId: item.fromUserId,
        claimedAt: formattedDate,
      },
    };
    saveLocalClaimedMap(updatedClaims);

    // Si es cuota de alquiler, registrar fecha del pago para regla de puntualidad
    if (item.id.startsWith("rent_")) {
      await rentService.recordRentPayment({
        userId: item.fromUserId,
        monthStr: selectedMonth,
      });
    }

    // Registrar aviso en Supabase para sincronizar entre navegadores
    try {
      await expensesService.createExpense({
        household_id: DEFAULT_HOUSEHOLD_ID,
        description: `Aviso de pago: ${item.concept}`,
        amount: item.amount,
        paid_by: item.fromUserId,
        category: "payment_claim",
        notes: `claimed_debt:${item.id}`,
        participantUserIds: [item.toUserId],
      });
    } catch {
      // ignore
    }

    // Enviar notificación al acreedor
    try {
      await notificationService.sendPaymentSentNotice({
        senderName: from.name,
        senderUserId: from.id,
        creditorName: to.name,
        creditorUserId: to.id,
        amount: item.amount,
        concept: item.concept,
      });
    } catch {
      // ignore
    }

    triggerToast(`💸 Has avisado a ${to.name}. La transferencia espera su confirmación de cobro.`);
  };

  // Deshacer el aviso de pago del deudor
  const handleUndoClaim = async (item: ItemizedTransfer) => {
    const updatedClaims = { ...localClaimedMap };
    delete updatedClaims[item.id];
    saveLocalClaimedMap(updatedClaims);

    const claimExpense = expenses.find(
      (e) => e.category === "payment_claim" && e.notes === `claimed_debt:${item.id}`
    );
    if (claimExpense && onDeleteSettlement) {
      void onDeleteSettlement(claimExpense.id);
    }

    triggerToast("Aviso de pago cancelado. La deuda vuelve a estar pendiente.");
  };

  // 2. El acreedor confirma la recepción: se liquida definitivamente y pasa al Historial
  const handleConfirmReceived = async (item: ItemizedTransfer) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })} ${now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
    const from = getFlatmate(item.fromUserId);
    const to = getFlatmate(item.toUserId);

    setJustSettledId(item.id);

    // 1. Limpiar claim si existía
    const updatedClaims = { ...localClaimedMap };
    delete updatedClaims[item.id];
    saveLocalClaimedMap(updatedClaims);

    const claimExpense = expenses.find(
      (e) => e.category === "payment_claim" && e.notes === `claimed_debt:${item.id}`
    );
    if (claimExpense && onDeleteSettlement) {
      void onDeleteSettlement(claimExpense.id);
    }

    // 2. Guardar estado liquidado local
    const updatedSettled = {
      ...localSettledMap,
      [item.id]: {
        ...item,
        settledAt: formattedDate,
      },
    };
    saveLocalSettledMap(updatedSettled);

    // 3. Si es alquiler, evaluar puntualidad (regla de los 5 primeros días del mes)
    if (item.id.startsWith("rent_")) {
      const res = await rentService.recordRentPayment({
        userId: item.fromUserId,
        monthStr: selectedMonth,
      });

      if (res.isOnTime) {
        setRentFeedback({
          isOnTime: true,
          message: `¡Pago confirmado a tiempo! +1 punto de convivencia ganado para ${from.name}. 🏆`,
        });
      } else {
        setRentFeedback({
          isOnTime: false,
          message: `Pago fuera de plazo (después del día 5). Se aplica penalización de -1 punto a ${from.name}. ⚠️`,
        });
      }
    }

    // 4. Enviar notificación al deudor de confirmación
    try {
      await notificationService.sendPaymentReceivedNotice({
        senderName: to.name,
        senderUserId: to.id,
        debtorName: from.name,
        debtorUserId: from.id,
        amount: item.amount,
        concept: item.concept,
      });
    } catch {
      // ignore
    }

    // 5. Persistir liquidación definitiva en Supabase
    if (onSettleTransfer) {
      try {
        await onSettleTransfer({
          fromUserId: item.fromUserId,
          toUserId: item.toUserId,
          amount: item.amount,
          debtKey: item.id,
          concept: item.concept,
        });
      } catch (err) {
        console.error("Error sincronizando liquidación en Supabase:", err);
      }
    }

    triggerToast(`✅ Cobro de ${formatEuro(item.amount)} confirmado. Se ha avisado a ${from.name}.`);

    setTimeout(() => {
      setJustSettledId(null);
    }, 300);
  };

  // Deshacer liquidación
  const handleUndo = async (item: SettledTransferRecord) => {
    // Eliminar del almacenamiento local
    const updatedLocal = { ...localSettledMap };
    delete updatedLocal[item.id];
    saveLocalSettledMap(updatedLocal);

    // Si es cuota de alquiler, revertir en rentService
    if (item.id.startsWith("rent_")) {
      void rentService.toggleRentPayment({
        userId: item.fromUserId,
        monthStr: selectedMonth,
      });
    }

    // Si existe fila en Supabase, borrarla en tiempo real
    if (item.settlementId && onDeleteSettlement) {
      try {
        await onDeleteSettlement(item.settlementId);
      } catch (err) {
        console.error("Error revirtiendo liquidación en Supabase:", err);
      }
    }
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
          {pendingList.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-extrabold leading-none">
              {pendingList.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("historial")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all relative",
            activeSubTab === "historial"
              ? "bg-white text-[#31405F] shadow-2xs"
              : "text-[#607283] hover:text-[#31405F]"
          )}
        >
          <History className="h-3.5 w-3.5" />
          <span>Historial</span>
          {settledList.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold leading-none">
              {settledList.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-PESTAÑA 1: TRANSFERENCIAS PENDIENTES (DESGLOSADAS POR GASTO) */}
      {/* ========================================================================= */}
      {activeSubTab === "pendientes" && (
        <div className="space-y-3 animate-in fade-in-50 duration-150">
          {pendingList.length > 0 ? (
            pendingList.map((item) => {
              const from = getFlatmate(item.fromUserId);
              const to = getFlatmate(item.toUserId);
              const visual = getCategoryVisual(item.category);
              const IconComp = visual.icon;
              const isSettling = justSettledId === item.id;
              const isClaimed = isDebtClaimed(item);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-3xl border bg-white p-4 sm:p-5 shadow-xs transition-all space-y-3",
                    isClaimed
                      ? "border-amber-400/80 bg-amber-50/20 shadow-xs"
                      : "border-[#BFC6CC]/70 hover:border-[#194F6B]/40",
                    isSettling && "opacity-30 scale-98 transition-all duration-300"
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

                  {/* Aviso si el deudor ya ha marcado pagado (esperando confirmación del acreedor) */}
                  {isClaimed && (
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-900 animate-in fade-in-50 duration-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm leading-none">💸</span>
                        <span className="text-xs font-medium">
                          {currentUserId === item.fromUserId ? (
                            <>
                              Has indicado que ya has pagado <strong>{formatEuro(item.amount)}</strong>. Esperando confirmación de cobro de <strong>{to.name}</strong>.
                            </>
                          ) : (
                            <>
                              <strong>{from.name}</strong> indica que ya te ha transferido <strong>{formatEuro(item.amount)}</strong>.
                            </>
                          )}
                        </span>
                      </div>
                      {currentUserId === item.fromUserId && (
                        <button
                          type="button"
                          onClick={() => void handleUndoClaim(item)}
                          className="shrink-0 text-xs font-bold text-amber-800 hover:text-amber-950 underline ml-2 cursor-pointer"
                        >
                          Deshacer
                        </button>
                      )}
                    </div>
                  )}

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

                    {/* Flecha conectora central con importe */}
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

                  {/* Pie de acción: Avisar / Marcar pagado según rol */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#BFC6CC]/30 flex-wrap gap-2">
                    <span className="text-[11px] text-[#607283]">
                      {from.name} le transfiere a {to.name}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Si soy el deudor (el que debe pagar): */}
                      {currentUserId === item.fromUserId ? (
                        isClaimed ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300/60 shadow-2xs">
                              <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                              <span>Pagado (esperando confirmación)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleUndoClaim(item)}
                              className="text-xs font-semibold text-[#607283] hover:text-rose-600 underline transition-colors cursor-pointer"
                            >
                              Deshacer
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleDebtorMarkPaid(item)}
                            disabled={isSettling}
                            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-[#31405F] text-white hover:bg-[#194F6B] active:scale-95 transition-all shadow-2xs border border-[#31405F] cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>Pagado</span>
                          </button>
                        )
                      ) : currentUserId === item.toUserId ? (
                        /* Si soy el acreedor (el que recibe el dinero): */
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!isClaimed && (
                            <button
                              type="button"
                              onClick={() => void handleSendDebtReminder(item)}
                              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border border-amber-500/50 bg-amber-50 text-amber-800 hover:bg-amber-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
                              title="Avisar de que falta por pagar"
                            >
                              <BellRing className="h-3.5 w-3.5 text-amber-600" />
                              <span>Avisar de pago</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleConfirmReceived(item)}
                            disabled={isSettling}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white active:scale-95 transition-all shadow-2xs cursor-pointer",
                              isClaimed
                                ? "bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/30 animate-pulse"
                                : "bg-emerald-700 hover:bg-emerald-800 border border-emerald-700"
                            )}
                          >
                            <CheckCheck className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>{isClaimed ? "Confirmar recibido" : "Recibido"}</span>
                          </button>
                        </div>
                      ) : (
                        /* Para Jorge u otro compañero observador: */
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {currentUserId === "22222222-2222-4222-8222-222222222222" && !isClaimed && (
                            <button
                              type="button"
                              onClick={() => void handleSendDebtReminder(item)}
                              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border border-amber-500/50 bg-amber-50 text-amber-800 hover:bg-amber-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
                              title="Avisar de que falta por pagar"
                            >
                              <BellRing className="h-3.5 w-3.5 text-amber-600" />
                              <span>Avisar</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleConfirmReceived(item)}
                            disabled={isSettling}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white active:scale-95 transition-all shadow-2xs cursor-pointer",
                              isClaimed
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-[#31405F] hover:bg-[#194F6B] border border-[#31405F]"
                            )}
                          >
                            <CheckCheck className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>{isClaimed ? "Confirmar recibido" : "Marcar recibido"}</span>
                          </button>
                        </div>
                      )}
                    </div>
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
                Todos los gastos individuales y facturas están al día.
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
          {settledList.length > 0 ? (
            settledList.map((item) => {
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
                        onClick={() => void handleUndo(item)}
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
                Las transferencias marcadas como pagadas quedarán registradas aquí para todos los compañeros.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Toast flotante para confirmación de avisos y pagos */}
      {actionToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-[#31405F] text-white px-4 py-2.5 shadow-xl border border-[#194F6B] text-xs font-bold flex items-center gap-2 animate-in fade-in-50 duration-150 pointer-events-none">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* Banner flotante de puntuación de alquiler (regla de los 5 días) */}
      {rentFeedback && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-3xl p-4 shadow-2xl border bg-white animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start gap-3">
            <div className="text-2xl shrink-0">
              {rentFeedback.isOnTime ? "🏆" : "⚠️"}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={cn("text-xs font-extrabold", rentFeedback.isOnTime ? "text-emerald-700" : "text-amber-700")}>
                {rentFeedback.isOnTime ? "+1 Punto de convivencia" : "Pago fuera de plazo"}
              </h4>
              <p className="text-[11px] text-[#607283] mt-0.5 leading-relaxed">
                {rentFeedback.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRentFeedback(null)}
              className="text-[#607283] hover:text-[#31405F] p-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
