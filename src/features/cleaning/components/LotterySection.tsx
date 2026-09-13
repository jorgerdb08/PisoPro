"use client";

import React, { useState } from "react";
import type { CleaningLottery, ZoneAssignment } from "@/types";
import { Dices, Loader2 } from "lucide-react";
import { ZoneIcon } from "./ZoneIcon";
import { cn } from "@/lib/utils";

const ZONE_THEMES: Record<
  string,
  {
    card: string;
    iconBox: string;
    iconColor: string;
    titleColor: string;
  }
> = {
  cocina: {
    card: "bg-[#FFF9F2] border-[#FDE6D2] hover:border-[#FBD5B5]",
    iconBox: "bg-white border-[#FDE6D2] shadow-2xs",
    iconColor: "text-amber-600",
    titleColor: "text-amber-950",
  },
  salon: {
    card: "bg-[#F4F7FB] border-[#D9E3ED] hover:border-[#C5D5E4]",
    iconBox: "bg-white border-[#D9E3ED] shadow-2xs",
    iconColor: "text-[#31405F]",
    titleColor: "text-[#1E293B]",
  },
  bano: {
    card: "bg-[#F0FBF9] border-[#CEEFE8] hover:border-[#B4E5DC]",
    iconBox: "bg-white border-[#CEEFE8] shadow-2xs",
    iconColor: "text-teal-600",
    titleColor: "text-teal-950",
  },
};

const defaultZoneTheme = {
  card: "bg-slate-50 border-slate-200/80",
  iconBox: "bg-white border-slate-200/60 shadow-2xs",
  iconColor: "text-slate-600",
  titleColor: "text-slate-800",
};

interface LotterySectionProps {
  lottery: CleaningLottery | null;
  assignments: ZoneAssignment[];
  isAdmin: boolean;
  onExecuteLottery: () => Promise<{ success: boolean; error?: string }>;
}

export const LotterySection: React.FC<LotterySectionProps> = ({
  lottery,
  assignments,
  isAdmin,
  onExecuteLottery,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLocked = Boolean(lottery?.is_locked);

  // REGLA DE NEGOCIO: Una vez realizado y fijado el sorteo inicial,
  // desaparece por completo de la pantalla para no ocupar espacio.
  if (isLocked) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 mb-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#31405F]/10 text-[#31405F] flex items-center justify-center">
              <Dices className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Asignación Inicial de Zonas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Las 3 zonas principales comienzan sin asignar. El administrador debe realizar el sorteo una única vez para activar la rotación semanal automática de los lunes.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={async () => {
              setIsRunning(true);
              setErrorMsg(null);
              try {
                const res = await onExecuteLottery();
                if (!res.success) {
                  setErrorMsg(res.error || "No se pudo ejecutar el sorteo");
                }
              } finally {
                setIsRunning(false);
              }
            }}
            disabled={isRunning}
            className="px-4 py-2.5 bg-[#31405F] hover:bg-[#194F6B] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shrink-0"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sorteando...</span>
              </>
            ) : (
              <>
                <Dices className="w-3.5 h-3.5" />
                <span>Realizar sorteo</span>
              </>
            )}
          </button>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            Esperando a que Jorge realice el sorteo inicial.
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Vista de las 3 zonas con fondo suave personalizado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-100">
        {assignments.map((z) => {
          const theme = ZONE_THEMES[z.zone_slug.toLowerCase()] || defaultZoneTheme;

          return (
            <div
              key={z.zone_id}
              className={cn(
                "rounded-xl border p-3 flex items-center space-x-2.5 transition-all shadow-2xs",
                theme.card
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg border flex items-center justify-center",
                  theme.iconBox,
                  theme.iconColor
                )}
              >
                <ZoneIcon slug={z.zone_slug} className="w-4 h-4" />
              </div>
              <span className={cn("text-xs font-bold tracking-tight", theme.titleColor)}>
                {z.zone_name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
