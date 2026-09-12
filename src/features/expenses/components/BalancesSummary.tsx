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
              ? "border-rose-500/30 bg-rose-500/5 text-foreground"
              : "border-border/80 bg-card text-foreground"
          )}
        >
          <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider block">
            Debes
          </span>
          <p
            className={cn(
              "mt-1 text-xl font-extrabold tracking-tight",
              userSummary.totalOwedByMe > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
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
              ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
              : "border-border/80 bg-card text-foreground"
          )}
        >
          <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider block">
            Te deben
          </span>
          <p
            className={cn(
              "mt-1 text-xl font-extrabold tracking-tight",
              userSummary.totalOwedToMe > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-foreground"
            )}
          >
            {formatEuro(userSummary.totalOwedToMe)}
          </p>
        </div>
      </div>

      {/* Net status message */}
      <div className="rounded-2xl border border-border/80 bg-card p-3 text-center">
        <span className="text-muted-foreground text-xs">
          Balance neto general:{" "}
          <strong
            className={cn(
              userSummary.netBalance > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : userSummary.netBalance < 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-foreground"
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
          <h3 className="text-foreground text-sm font-bold flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span>Liquidaciones pendientes</span>
          </h3>
          <span className="text-muted-foreground text-[11px]">
            {pendingTransfers.length} {pendingTransfers.length === 1 ? "pago" : "pagos"}
          </span>
        </div>

        {pendingTransfers.length > 0 ? (
          <div className="divide-border/60 border-border/80 rounded-2xl border divide-y overflow-hidden bg-card">
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
                  className="flex items-center justify-between p-3.5 hover:bg-secondary/40 transition-colors"
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

                    <span className="font-semibold text-foreground">
                      {isPayer ? "Tú" : fromFlatmate?.name}
                    </span>

                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />

                    {/* To Avatar */}
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-xl text-[10px] font-bold text-white shadow-xs",
                        toFlatmate?.color || "bg-slate-700"
                      )}
                    >
                      {toFlatmate?.name.charAt(0) || "?"}
                    </span>

                    <span className="font-semibold text-foreground">
                      {isReceiver ? "Tú" : toFlatmate?.name}
                    </span>
                  </div>

                  {/* Transfer Action */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-foreground">
                      {formatEuro(t.amount)}
                    </span>

                    <button
                      type="button"
                      data-testid={`settle-btn-${fromFlatmate?.name.toLowerCase()}-${toFlatmate?.name.toLowerCase()}`}
                      disabled={isBusy}
                      onClick={() => handleSettle(t)}
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-1"
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
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 p-8 text-center space-y-2 bg-card/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="text-foreground text-sm font-bold">¡Cuentas al día!</h4>
            <p className="text-muted-foreground text-xs max-w-xs">
              Nadie le debe dinero a nadie en el piso en este momento. ¡Paz y armonía total!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
