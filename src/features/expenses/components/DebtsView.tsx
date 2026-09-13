"use client";

import React, { useState } from "react";
import type { DebtTransfer } from "../calculations";
import { FLATMATES } from "@/lib/constants";
import { ArrowRight, CheckCircle2, Scale, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebtsViewProps {
  pendingTransfers: DebtTransfer[];
  netBalances: Record<string, number>;
  onSettleTransfer: (transfer: DebtTransfer) => Promise<unknown>;
}

export function DebtsView({
  pendingTransfers,
  netBalances,
  onSettleTransfer,
}: DebtsViewProps) {
  const [settlingKey, setSettlingKey] = useState<string | null>(null);
  const [settledSuccessKey, setSettledSuccessKey] = useState<string | null>(null);

  const formatEuro = (val: number) =>
    (val || 0).toFixed(2).replace(".", ",") + " €";

  const getFlatmate = (id: string) =>
    FLATMATES.find((f) => f.id === id) || {
      id,
      name: "Compañero",
      avatar: "👤",
      color: "#31405F",
    };

  const handleSettle = async (transfer: DebtTransfer) => {
    const key = `${transfer.fromUserId}-${transfer.toUserId}-${transfer.amount}`;
    setSettlingKey(key);
    try {
      await onSettleTransfer(transfer);
      setSettledSuccessKey(key);
      setTimeout(() => setSettledSuccessKey(null), 3000);
    } finally {
      setSettlingKey(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header explicativo */}
      <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#094152]/10 text-[#094152] border border-[#094152]/20 shadow-xs">
            <Scale className="h-5 w-5 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#31405F]">
              Deudas y Ajustes de Cuentas
            </h3>
            <p className="text-xs text-[#607283]">
              Quién debe a quién para dejar todas las cuentas a cero con las mínimas transferencias posibles.
            </p>
          </div>
        </div>

        {/* Resumen de balances de los 3 compañeros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[#BFC6CC]/30">
          {FLATMATES.map((flatmate) => {
            const balance = netBalances[flatmate.id] || 0;
            const isCreditor = balance > 0.01;
            const isDebtor = balance < -0.01;

            return (
              <div
                key={flatmate.id}
                className={cn(
                  "rounded-2xl border p-3 flex flex-col justify-between transition-all",
                  isCreditor
                    ? "border-emerald-500/30 bg-emerald-50/40"
                    : isDebtor
                    ? "border-rose-500/30 bg-rose-50/30"
                    : "border-[#BFC6CC]/40 bg-[#F4F7F8]/60"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold text-white shadow-2xs"
                      style={{ backgroundColor: flatmate.color }}
                    >
                      {flatmate.name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-[#31405F]">
                      {flatmate.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-md",
                      isCreditor
                        ? "bg-emerald-100 text-emerald-800"
                        : isDebtor
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-200 text-slate-700"
                    )}
                  >
                    {isCreditor ? "Le deben" : isDebtor ? "Debe pagar" : "Al día"}
                  </span>
                </div>

                <div className="mt-2 text-right">
                  <span
                    className={cn(
                      "text-lg font-black tracking-tight",
                      isCreditor
                        ? "text-emerald-700"
                        : isDebtor
                        ? "text-rose-700"
                        : "text-[#607283]"
                    )}
                  >
                    {isCreditor && "+"}
                    {formatEuro(balance)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de transferencias con FLECHAS visuales */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#31405F]">
            Transferencias Pendientes ({pendingTransfers.length})
          </h4>
        </div>

        {pendingTransfers.length > 0 ? (
          pendingTransfers.map((transfer) => {
            const from = getFlatmate(transfer.fromUserId);
            const to = getFlatmate(transfer.toUserId);
            const key = `${transfer.fromUserId}-${transfer.toUserId}-${transfer.amount}`;
            const isSettling = settlingKey === key;
            const isSettled = settledSuccessKey === key;

            return (
              <div
                key={key}
                className="rounded-2xl border border-[#BFC6CC]/60 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-[#194F6B]/30 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  {/* Persona que debe (DEUDOR) */}
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white shadow-xs"
                      style={{ backgroundColor: from.color }}
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

                  {/* FLECHA VISUAL CON IMPORTE */}
                  <div className="flex-1 flex items-center justify-center min-w-[160px] px-2 py-1">
                    <div className="relative flex items-center w-full max-w-[220px]">
                      {/* Línea conectora */}
                      <div className="w-full h-0.5 bg-[#BFC6CC]" />

                      {/* Insignia central con importe y flecha */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex items-center gap-1.5 rounded-full border border-[#BFC6CC] bg-[#F4F7F8] px-3 py-1 shadow-2xs pointer-events-auto">
                          <span className="text-xs font-black text-[#31405F] tracking-tight">
                            {formatEuro(transfer.amount)}
                          </span>
                          <ArrowRight className="h-4 w-4 text-[#094152] shrink-0 stroke-[2.5]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Persona que recibe (ACREEDOR) */}
                  <div className="flex items-center gap-3 min-w-[120px] justify-end">
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#31405F] block">
                        {to.name}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600">
                        Recibe
                      </span>
                    </div>
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white shadow-xs"
                      style={{ backgroundColor: to.color }}
                    >
                      {to.name.charAt(0)}
                    </div>
                  </div>
                </div>

                {/* Botón de acción para saldar */}
                <div className="flex items-center justify-between pt-2 border-t border-[#BFC6CC]/30">
                  <span className="text-[11px] text-[#607283]">
                    {from.name} le paga {formatEuro(transfer.amount)} a {to.name}
                  </span>

                  <button
                    type="button"
                    onClick={() => void handleSettle(transfer)}
                    disabled={isSettling || isSettled}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-xs border",
                      isSettled
                        ? "bg-emerald-500 text-white border-emerald-600"
                        : "bg-[#31405F] text-white border-[#31405F] hover:bg-[#194F6B]"
                    )}
                  >
                    {isSettling ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saldando...</span>
                      </>
                    ) : isSettled ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>¡Saldada!</span>
                      </>
                    ) : (
                      <>
                        <span>Marcar como pagado</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-50/20 p-8 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6 stroke-[2.25]" />
            </div>
            <h4 className="text-sm font-bold text-[#31405F]">
              ¡Todas las cuentas al día!
            </h4>
            <p className="text-xs text-[#607283] max-w-sm mx-auto">
              No hay transferencias ni deudas pendientes entre vosotros. Cada compañero ha pagado exactamente lo que le corresponde.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
