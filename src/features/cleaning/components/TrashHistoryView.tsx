"use client";

import React, { useState } from "react";
import { useTrash } from "@/features/cleaning/useTrash";
import type { DateRangeFilter } from "@/services/trashService";

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
    <div className="space-y-6">
      {/* Botón Principal para tirar la basura */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <span className="text-4xl p-2 bg-emerald-100/70 rounded-2xl">🗑️</span>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Gestión de Basura
            </h3>
            <p className="text-xs text-slate-600">
              Cualquiera puede tirar la basura cuando quiera. Cada acción suma{" "}
              <strong className="text-emerald-700 font-bold">+1 punto</strong> real.
            </p>
          </div>
        </div>

        <button
          onClick={handleRecordTrash}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <span>🗑️</span>
          <span>{isSubmitting ? "Registrando..." : "HE TIRADO LA BASURA"}</span>
        </button>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>✓ ¡Basura registrada! Se ha sumado +1 punto a tu cuenta.</span>
        </div>
      )}

      {/* Filtros temporales */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          Estadísticas de Basura
        </h4>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
          {(["week", "month", "all"] as DateRangeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === f
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {f === "week" ? "Esta semana" : f === "month" ? "Este mes" : "Todo"}
            </button>
          ))}
        </div>
      </div>

      {/* Contadores por persona */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.user_id}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs"
          >
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                {s.user_name}
              </p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {s.count}{" "}
                <span className="text-xs font-normal text-slate-500">veces</span>
              </p>
            </div>
            <div className="text-2xl p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              🗑️
            </div>
          </div>
        ))}
      </div>

      {/* Historial de eventos */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Historial de Registros
          </h5>
          <span className="text-xs text-slate-400 font-medium">
            {events.length} registros
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
                  className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-base">🗑️</span>
                    <div>
                      <span className="font-bold text-slate-800">
                        {e.user_name || "Compañero"}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {day} · {time}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    +1 punto
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
