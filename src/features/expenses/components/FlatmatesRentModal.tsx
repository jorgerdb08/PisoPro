"use client";

import React, { useEffect } from "react";
import { X, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { FLATMATES } from "@/lib/constants";
import type { FlatmateRentStatus } from "@/services/rentService";

interface FlatmatesRentModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthName: string;
  totalRent: number;
  paidCount: number;
  flatmateStatuses: FlatmateRentStatus[];
  currentUserId?: string;
  onToggleRentPaid: (userId: string) => Promise<unknown>;
}

export function FlatmatesRentModal({
  isOpen,
  onClose,
  monthName,
  totalRent,
  paidCount,
  flatmateStatuses,
  currentUserId,
  onToggleRentPaid,
}: FlatmatesRentModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatEuro = (n: number) => (n || 0).toFixed(2).replace(".", ",") + " €";
  const progressPercent = Math.round((paidCount / 3) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-50 duration-150">
      <div
        className="w-full max-w-md rounded-3xl border border-[#BFC6CC]/70 bg-white p-5 sm:p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#31405F]/10 text-[#31405F] border border-[#31405F]/20">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#31405F]">
                Alquiler del Piso
              </h3>
              <p className="text-xs text-[#607283]">
                {monthName} · {formatEuro(totalRent)} total (200,00 € c/u)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#607283] hover:bg-[#F4F7F8] hover:text-[#31405F] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-1.5 rounded-2xl bg-[#F4F7F8] p-3 border border-[#BFC6CC]/40">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#31405F]">
              {paidCount} de 3 pagados
            </span>
            <span className="font-extrabold text-[#31405F]">
              {progressPercent}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#BFC6CC]/40">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Lista de compañeros */}
        <div className="space-y-2.5">
          {flatmateStatuses.map((flatmate) => {
            const isPaid = flatmate.isPaid;
            const isMe = flatmate.userId === currentUserId;
            const flatmateDef = FLATMATES.find((f) => f.id === flatmate.userId);
            const colorClass = flatmateDef?.color || "bg-[#31405F] text-white";

            return (
              <div
                key={flatmate.userId}
                className={cn(
                  "flex items-center justify-between rounded-2xl p-3.5 transition-all border",
                  isMe
                    ? "bg-[#31405F]/5 border-[#31405F]/30"
                    : "bg-white border-[#BFC6CC]/60"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs",
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
                    <span className="text-[11px] font-semibold text-[#607283] whitespace-nowrap">
                      Cuota: 200,00 €
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void onToggleRentPaid(flatmate.userId)}
                  className={cn(
                    "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 border whitespace-nowrap min-w-[100px] text-center shadow-2xs",
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

        {/* Footer */}
        <div className="pt-2 border-t border-[#BFC6CC]/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#31405F] px-4 py-2 text-xs font-bold text-white hover:bg-[#194F6B] active:scale-95 transition-all shadow-2xs"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
