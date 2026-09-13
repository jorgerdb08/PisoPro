"use client";

import React, { useState } from "react";
import {
  Home,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  Calendar,
  Zap,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { FlatmateMonthlyShare } from "../calculations";
import type { FlatmateRentStatus } from "@/services/rentService";
import { cn } from "@/lib/utils";

interface MonthlyQuotaCardProps {
  share: FlatmateMonthlyShare;
  rentStatus?: FlatmateRentStatus;
  isCurrentUser: boolean;
  isAdmin: boolean;
  onPayRent: (userId: string, paidDate?: string) => Promise<unknown>;
  onSendReminder: () => Promise<unknown>;
}

export function MonthlyQuotaCard({
  share,
  rentStatus,
  isCurrentUser,
  isAdmin,
  onPayRent,
  onSendReminder,
}: MonthlyQuotaCardProps) {
  const [isPaying, setIsPaying] = useState(false);
  const [isReminding, setIsReminding] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentDate, setPaymentDate] = useState(() =>
    new Date().toISOString().split("T")[0]!
  );

  const formatEuro = (val: number) =>
    (val || 0).toFixed(2).replace(".", ",") + " €";

  const isPaid = rentStatus?.isPaid ?? false;
  const isOnTime = rentStatus?.isOnTime ?? false;
  const pointsAwarded = rentStatus?.pointsAwarded ?? 0;

  const handleConfirmPay = async () => {
    setIsPaying(true);
    try {
      await onPayRent(share.userId, paymentDate);
      setShowDatePicker(false);
    } finally {
      setIsPaying(false);
    }
  };

  const handleRemind = async () => {
    setIsReminding(true);
    try {
      await onSendReminder();
    } finally {
      setIsReminding(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 transition-all shadow-xs space-y-3",
        isCurrentUser
          ? "border-[#31405F]/40 ring-1 ring-[#31405F]/15"
          : "border-[#BFC6CC]/60"
      )}
    >
      {/* Header: Avatar, Name, Role & Net Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#31405F] text-white text-xs font-bold shadow-2xs">
            {share.userName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-[#31405F] text-sm font-bold tracking-tight">
                {share.userName}
              </h4>
              {isCurrentUser && (
                <span className="rounded-full bg-[#31405F]/10 px-2 py-0.5 text-[10px] font-bold text-[#31405F]">
                  Tú
                </span>
              )}
            </div>
            <p className="text-[#607283] text-[11px]">
              Cuota fija alquiler: 200,00 €
            </p>
          </div>
        </div>

        {/* Total to pay badge */}
        <div className="text-right">
          <span className="text-[#607283] text-[10px] font-semibold uppercase tracking-wider block">
            Cuota del Mes
          </span>
          <span className="text-[#31405F] text-base font-extrabold tracking-tight">
            {formatEuro(share.totalToPay)}
          </span>
        </div>
      </div>

      {/* Estado del Alquiler Fijo (200 €) y Regla de Puntos */}
      <div className="rounded-xl border border-[#BFC6CC]/40 bg-[#F4F7F8]/70 p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#31405F]/10 text-[#31405F]">
            <Home className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#31405F]">Alquiler</span>
              <span className="text-xs text-[#607283]">200,00 €</span>
            </div>
            <span className="text-[10px] text-[#8C9AA6]">
              Límite bonificado: día 5 (+1 pt)
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isPaid ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
                isOnTime
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-700 border-amber-500/20"
              )}
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>
                {isOnTime ? "Pagado (+1 pt 🏆)" : "Pagado tarde (-1 pt ⚠️)"}
              </span>
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
                pointsAwarded < 0
                  ? "bg-rose-500/10 text-rose-700 border-rose-500/20"
                  : "bg-amber-500/10 text-amber-700 border-amber-500/20"
              )}
            >
              <Clock className="h-3 w-3" />
              <span>
                {pointsAwarded < 0 ? "Pendiente (-1 pt)" : "Pendiente"}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Desglose de Gastos Variables */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-[#BFC6CC]/30 bg-white p-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
            <Zap className="h-3 w-3" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-[#607283] block truncate">
              Suministros (÷3)
            </span>
            <span className="font-bold text-[#31405F] text-xs">
              {formatEuro(share.suppliesShare)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#BFC6CC]/30 bg-white p-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
            <ShoppingCart className="h-3 w-3" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-[#607283] block truncate">
              Compras & Cenas
            </span>
            <span className="font-bold text-[#31405F] text-xs">
              {formatEuro(share.variableShare)}
            </span>
          </div>
        </div>
      </div>

      {/* Balance Neto: Adelantado vs Owed */}
      <div className="flex items-center justify-between border-t border-[#BFC6CC]/30 pt-2 text-xs">
        <span className="text-[#607283] text-[11px]">
          Adelantado en facturas:{" "}
          <strong className="text-[#31405F]">{formatEuro(share.totalAdvanced)}</strong>
        </span>

        <div className="flex items-center gap-1 font-semibold">
          {share.netMonthBalance > 0 ? (
            <span className="text-emerald-700 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              <span>+{formatEuro(share.netMonthBalance)} a favor</span>
            </span>
          ) : share.netMonthBalance < 0 ? (
            <span className="text-rose-600 flex items-center gap-0.5">
              <TrendingDown className="h-3 w-3" />
              <span>{formatEuro(Math.abs(share.netMonthBalance))} a pagar</span>
            </span>
          ) : (
            <span className="text-[#607283]">Al día</span>
          )}
        </div>
      </div>

      {/* Acciones de Pago de Alquiler y Recordatorio */}
      {!isPaid && (
        <div className="space-y-2 pt-1">
          {showDatePicker ? (
            <div className="rounded-xl border border-[#31405F]/30 bg-[#FAFBFC] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#31405F]">
                  Fecha en que se realizó el pago:
                </span>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="text-[11px] text-[#607283] hover:underline"
                >
                  Cancelar
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="flex-1 rounded-xl border border-[#BFC6CC] bg-white px-2.5 py-1.5 text-xs text-[#31405F] focus:outline-hidden focus:ring-1 focus:ring-[#31405F]"
                />
                <button
                  type="button"
                  onClick={handleConfirmPay}
                  disabled={isPaying}
                  className="rounded-xl bg-[#31405F] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#194F6B] transition-colors disabled:opacity-50"
                >
                  {isPaying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Confirmar"
                  )}
                </button>
              </div>
              <p className="text-[10px] text-[#607283]">
                * Si la fecha es día 1 al 5 suma +1 pt. Si es posterior penaliza con -1 pt.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {(isCurrentUser || isAdmin) && (
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#31405F] py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#194F6B] active:scale-95 transition-all"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Marcar Alquiler Pagado (200 €)</span>
                </button>
              )}

              {!isCurrentUser && (
                <button
                  type="button"
                  onClick={handleRemind}
                  disabled={isReminding}
                  title="Enviar recordatorio al chat y notificaciones"
                  className="rounded-xl border border-[#BFC6CC]/70 bg-white hover:bg-[#F4F7F8] p-2 text-[#607283] hover:text-[#31405F] transition-colors active:scale-95 shrink-0"
                >
                  {isReminding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
