"use client";

import React, { useEffect } from "react";
import { X, Home, Check, Clock } from "lucide-react";
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

  const samuelStatus = flatmateStatuses.find((s) => s.userName === "Samuel");
  const davidStatus = flatmateStatuses.find((s) => s.userName === "David");

  const hasSamuelPaid = samuelStatus?.isPaid ?? false;
  const hasDavidPaid = davidStatus?.isPaid ?? false;
  const collectedCount = (hasSamuelPaid ? 1 : 0) + (hasDavidPaid ? 1 : 0);
  const progressPercent = Math.round((collectedCount / 2) * 100);

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
                {monthName} · Jorge paga {formatEuro(totalRent)} al casero
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

        {/* Barra de progreso de recaudación */}
        <div className="space-y-1.5 rounded-2xl bg-[#F4F7F8] p-3 border border-[#BFC6CC]/40">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#31405F]">
              Recaudado para Jorge: {collectedCount} de 2 compañeros ({collectedCount * 200} € / 400 €)
            </span>
            <span className="font-extrabold text-[#31405F]">
              {progressPercent}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#BFC6CC]/40">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Lista de compañeros con roles reales */}
        <div className="space-y-2.5">
          {/* Jorge: Paga al casero */}
          <div className="flex items-center justify-between rounded-2xl p-3.5 border bg-[#31405F]/5 border-[#31405F]/30">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs bg-[#31405F] text-white">
                J
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#31405F]">
                    Jorge {currentUserId === "22222222-2222-4222-8222-222222222222" && "(Tú)"}
                  </span>
                  <span className="text-[9px] font-bold bg-[#31405F] text-white px-1.5 py-0.2 rounded-md">
                    Paga al casero
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#607283]">
                  Abona 600,00 € al propietario (cuota neta 200,00 €)
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#31405F] px-2.5 py-1 rounded-xl bg-white border border-[#BFC6CC]/60 shadow-2xs whitespace-nowrap">
              Responsable
            </span>
          </div>

          {/* Samuel */}
          <div className="flex items-center justify-between rounded-2xl p-3.5 border bg-white border-[#BFC6CC]/60">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs bg-[#094152] text-white">
                S
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#31405F]">
                    Samuel {currentUserId === "33333333-3333-4333-8333-333333333333" && "(Tú)"}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#607283]">
                  Cuota: 200,00 € a Jorge
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => samuelStatus && void onToggleRentPaid(samuelStatus.userId)}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 border whitespace-nowrap min-w-[105px] text-center shadow-2xs",
                hasSamuelPaid
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-[#F4F7F8] text-[#607283] border-[#BFC6CC]/70 hover:bg-[#eceef0] hover:text-[#31405F]"
              )}
            >
              {hasSamuelPaid ? (
                <span className="inline-flex items-center gap-1 justify-center">
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Pagado</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 justify-center">
                  <Clock className="h-3.5 w-3.5 stroke-[2]" />
                  <span>Pendiente</span>
                </span>
              )}
            </button>
          </div>

          {/* David */}
          <div className="flex items-center justify-between rounded-2xl p-3.5 border bg-white border-[#BFC6CC]/60">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs bg-[#194F6B] text-white">
                D
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#31405F]">
                    David {currentUserId === "44444444-4444-4444-8444-444444444444" && "(Tú)"}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#607283]">
                  Cuota: 200,00 € a Jorge
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => davidStatus && void onToggleRentPaid(davidStatus.userId)}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 border whitespace-nowrap min-w-[105px] text-center shadow-2xs",
                hasDavidPaid
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-[#F4F7F8] text-[#607283] border-[#BFC6CC]/70 hover:bg-[#eceef0] hover:text-[#31405F]"
              )}
            >
              {hasDavidPaid ? (
                <span className="inline-flex items-center gap-1 justify-center">
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Pagado</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 justify-center">
                  <Clock className="h-3.5 w-3.5 stroke-[2]" />
                  <span>Pendiente</span>
                </span>
              )}
            </button>
          </div>
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
