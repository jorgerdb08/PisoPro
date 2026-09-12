"use client";

import React, { useState } from "react";
import { FLATMATES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, DollarSign, Sparkles } from "lucide-react";
import type { DebtTransfer, UserBalanceSummary } from "@/features/expenses/calculations";

interface BalancesSummaryProps {
  userSummary: UserBalanceSummary;
  pendingTransfers: DebtTransfer[];
  currentUserId?: string;
  onSettleTransfer: (transfer: DebtTransfer) => Promise<unknown>;
}

export function BalancesSummary({
  userSummary,
  pendingTransfers,
  currentUserId,
  onSettleTransfer,
}: BalancesSummaryProps) {
  const [settlingTransfer, setSettlingTransfer] = useState<string | null>(null);

  const formatEuro = (num: number) =>
    num.toFixed(2).replace(".", ",") + " €";

  const handleSettle = async (transfer: DebtTransfer) => {
    const from = FLATMATES.find((f) => f.id === transfer.fromUserId)?.name || "Compañero";
    const to = FLATMATES.find((f) => f.id === transfer.toUserId)?.name || "Compañero";

    if (!window.confirm(`¿Confirmar que ${from} ha pagado ${formatEuro(transfer.amount)} a ${to}?`)) {
      return;
    }

    const key = `${transfer.fromUserId}-${transfer.toUserId}`;
    setSettlingTransfer(key);
    try {
      await onSettleTransfer(transfer);
    } finally {
      setSettlingTransfer(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* User Personal Balance Overview */}
      <div className="grid grid-cols-2 gap-3">
        {/* Debes */}
        <div
          data-testid="balance-owed-by-me"
          className={cn(
            "rounded-2xl border p-4 transition-all shadow-xs",
            userSummary.totalOwedByMe > 0
              ? "border-[#C995A2]/40 bg-[#C995A2]/10 text-[#31405F]"
              : "border-[#BFC6CC]/60 bg-white text-[#31405F]"
          )}
        >
          <span className="text-[#8B4B5B] text-[11px] font-semibold uppercase tracking-wider block">
            Debes
          </span>
          <p
            className={cn(
              "mt-1 text-xl font-extrabold tracking-tight",
              userSummary.totalOwedByMe > 0 ? "text-[#8B4B5B]" : "text-[#31405F]"
            )}
          >
            {formatEuro(userSummary.totalOwedByMe)}
          </p>
        </div>

        {/* Te deben */}
        <div
          data-testid="balance-owed-to-me"
          className={cn(
            "rounded-2xl border p-4 transition-all shadow-xs",
            userSummary.totalOwedToMe > 0
              ? "border-[#094152]/30 bg-[#094152]/10 text-[#31405F]"
              : "border-[#BFC6CC]/60 bg-white text-[#31405F]"
          )}
        >
          <span className="text-[#094152] text-[11px] font-semibold uppercase tracking-wider block">
            Te deben
          </span>
          <p
            className={cn(
              "mt-1 text-xl font-extrabold tracking-tight",
              userSummary.totalOwedToMe > 0
                ? "text-[#094152]"
                : "text-[#31405F]"
            )}
          >
            {formatEuro(userSummary.totalOwedToMe)}
          </p>
        </div>
      </div>

      {/* Net status message */}
      <div className="rounded-2xl border border-[#BFC6CC]/60 bg-white p-3 text-center">
        <span className="text-[#607283] text-xs">
          Balance neto general:{" "}
          <strong
            className={cn(
              userSummary.netBalance > 0
                ? "text-[#094152]"
                : userSummary.netBalance < 0
                ? "text-[#8B4B5B]"
                : "text-[#31405F]"
            )}
          >
            {userSummary.netBalance > 0 ? "+" : ""}
            {formatEuro(userSummary.netBalance)}
          </strong>
        </span>
      </div>

      {/* Debt Minimization Transfers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[#31405F] text-sm font-bold flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-[#094152]" />
            <span>Liquidaciones pendientes</span>
          </h3>
          <span className="text-[#607283] text-[11px]">
            {pendingTransfers.length} {pendingTransfers.length === 1 ? "pago" : "pagos"}
          </span>
        </div>

        {pendingTransfers.length > 0 ? (
          <div className="divide-[#BFC6CC]/40 border-[#BFC6CC]/60 rounded-2xl border divide-y overflow-hidden bg-white">
            {pendingTransfers.map((t) => {
              const fromFlatmate = FLATMATES.find((f) => f.id === t.fromUserId);
              const toFlatmate = FLATMATES.find((f) => f.id === t.toUserId);
              const isPayer = t.fromUserId === currentUserId;
              const isReceiver = t.toUserId === currentUserId;
              const transferKey = `${t.fromUserId}-${t.toUserId}`;
              const isBusy = settlingTransfer === transferKey;

              return (
                <div
                  key={transferKey}
                  data-testid={`transfer-item-${fromFlatmate?.name.toLowerCase()}-${toFlatmate?.name.toLowerCase()}`}
                  className="flex items-center justify-between p-3.5 hover:bg-[#F4F7F8] transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs">
                    {/* From Avatar */}
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-xl text-[10px] font-bold text-white shadow-xs",
                        fromFlatmate?.color || "bg-slate-700"
                      )}
                    >
                      {fromFlatmate?.name.charAt(0) || "?"}
                    </span>

                    <span className="font-semibold text-[#31405F]">
                      {isPayer ? "Tú" : fromFlatmate?.name}
                    </span>

                    <ArrowRight className="h-3 w-3 text-[#607283] shrink-0" />

                    {/* To Avatar */}
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-xl text-[10px] font-bold text-white shadow-xs",
                        toFlatmate?.color || "bg-slate-700"
                      )}
                    >
                      {toFlatmate?.name.charAt(0) || "?"}
                    </span>

                    <span className="font-semibold text-[#31405F]">
                      {isReceiver ? "Tú" : toFlatmate?.name}
                    </span>
                  </div>

                  {/* Transfer Action */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#31405F]">
                      {formatEuro(t.amount)}
                    </span>

                    <button
                      type="button"
                      data-testid={`settle-btn-${fromFlatmate?.name.toLowerCase()}-${toFlatmate?.name.toLowerCase()}`}
                      disabled={isBusy}
                      onClick={() => handleSettle(t)}
                      className="rounded-xl bg-[#094152] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#194F6B] active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{isBusy ? "Saldando..." : "Saldar"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#BFC6CC]/80 p-8 text-center space-y-2 bg-white/70">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#094152]/10 text-[#094152]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="text-[#31405F] text-sm font-bold">¡Cuentas al día!</h4>
            <p className="text-[#607283] text-xs max-w-xs">
              Nadie le debe dinero a nadie en el piso en este momento. ¡Paz y armonía total!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
