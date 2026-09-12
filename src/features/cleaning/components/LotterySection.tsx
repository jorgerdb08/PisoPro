"use client";

import React, { useState } from "react";
import type { CleaningLottery, ZoneAssignment } from "@/types";

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

  if (isLocked) {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🎲</span>
          <div>
            <p className="font-bold text-slate-800">
              Sorteo inicial completado y fijado
            </p>
            <p className="text-slate-500 text-[11px]">
              La rotación semanal cambia automáticamente cada lunes a las 00:00 (Cocina → Salón → Baño).
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full border border-emerald-300 text-[11px]">
          🔒 Sorteo Bloqueado (1 única vez)
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-white to-amber-50/50 border-2 border-indigo-200/80 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎲</span>
            <h2 className="text-base font-bold text-slate-900">
              Asignación Inicial de Zonas
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-md">
            Las 3 zonas principales comienzan sin asignar. El administrador debe realizar el sorteo una única vez para iniciar la rotación semanal automática.
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
            className="w-full sm:w-auto px-5 py-3 bg-[#31405F] hover:bg-[#194F6B] text-white font-bold text-sm rounded-xl shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <span className="animate-spin">🎲</span>
                <span>Sorteando zonas...</span>
              </>
            ) : (
              <>
                <span>🎲</span>
                <span>REALIZAR SORTEO</span>
              </>
            )}
          </button>
        ) : (
          <div className="px-4 py-2 bg-amber-100/70 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold">
            Esperando a que Jorge (admin) realice el sorteo inicial.
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Vista de las 3 zonas sin asignar antes del sorteo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200/60">
        {assignments.map((z) => (
          <div
            key={z.zone_id}
            className="bg-white/80 border border-dashed border-slate-300 rounded-xl p-3 flex items-center justify-between"
          >
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">{z.zone_icon}</span>
              <span className="text-sm font-semibold text-slate-800">
                {z.zone_name}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-400 italic">
              {z.assigned_user_name || "Sin asignar"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
