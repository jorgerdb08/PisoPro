"use client";

import React, { useState } from "react";
import { useTrash } from "@/features/cleaning/useTrash";
import type { DateRangeFilter } from "@/services/trashService";
import { Trash2, Check, Loader2 } from "lucide-react";

export const TrashHistoryView: React.FC = () => {
  const { events, stats, filter, setFilter, isLoading, isSubmitting, recordTrash } = useTrash();
  const [successToast, setSuccessToast] = useState<boolean>(false);

  const handleRecordTrash = async () => {
    const res = await recordTrash("general");
    if (res.success) {
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const day = d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    return { day, time };
  };

  return (
    <div className="space-y-4">
      {/* Botón Principal para tirar la basura */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl border border-slate-200/60">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Gestión de Basura
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Acción voluntaria abierta a todos. Cada vez que bajas la basura sumas{" "}
              <strong className="text-emerald-700 font-semibold">+1 punto</strong> directo.
            </p>
          </div>
        </div>

        <button
          onClick={handleRecordTrash}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#31405F] hover:bg-[#194F6B] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registrando...</span>
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              <span>He tirado la basura</span>
            </>
          )}
        </button>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center space-x-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>¡Basura registrada! Se ha sumado +1 punto a tu cuenta.</span>
        </div>
      )}

      {/* Filtros temporales */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Registros por Compañero
        </h4>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/70 text-xs font-medium">
          {(["week", "month", "all"] as DateRangeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === f
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {f === "week" ? "Semana" : f === "month" ? "Mes" : "Todo"}
            </button>
          ))}
        </div>
      </div>

      {/* Contadores por persona */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {stats.map((s) => (
          <div
            key={s.user_id}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between shadow-2xs"
          >
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                {s.user_name}
              </p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {s.count}{" "}
                <span className="text-xs font-normal text-slate-500">veces</span>
              </p>
            </div>
            <div className="p-2 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Historial de eventos */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Historial de Registros
          </h5>
          <span className="text-[11px] text-slate-400 font-medium">
            {events.length} veces
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Cargando historial...
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No hay registros de basura en este periodo.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((e) => {
              const { day, time } = formatDate(e.created_at);
              return (
                <div
                  key={e.id}
                  className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="font-semibold text-slate-800">
                        {e.user_name || "Compañero"}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {day} · {time}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 text-[11px]">
                    +1 pt
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
