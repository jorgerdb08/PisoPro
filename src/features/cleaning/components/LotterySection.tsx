"use client";

import React, { useState } from "react";
import type { CleaningLottery, ZoneAssignment } from "@/types";
import { Dices, Loader2 } from "lucide-react";
import { ZoneIcon } from "./ZoneIcon";

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
            className="w-full sm:w-auto px-4 py-2.5 bg-[#31405F] hover:bg-[#194F6B] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sorteando zonas...</span>
              </>
            ) : (
              <>
                <Dices className="w-4 h-4" />
                <span>Realizar sorteo</span>
              </>
            )}
          </button>
        ) : (
          <div className="px-3.5 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium">
            Esperando a que Jorge realice el sorteo inicial.
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Vista de las 3 zonas sin asignar antes del sorteo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-100">
        {assignments.map((z) => (
          <div
            key={z.zone_id}
            className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-white text-slate-600 rounded-lg border border-slate-200/60 shadow-2xs">
                <ZoneIcon slug={z.zone_slug} className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">
                {z.zone_name}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {z.assigned_user_name || "Sin asignar"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
