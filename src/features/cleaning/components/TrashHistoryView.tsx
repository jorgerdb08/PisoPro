"use client";

import React, { useState } from "react";
import { useTrash } from "@/features/cleaning/useTrash";
import type { DateRangeFilter } from "@/services/trashService";
import { Trash2, Check, Loader2 } from "lucide-react";

export const TrashHistoryView: React.FC = () => {
  const { events, stats, filter, setFilter, isLoading, isSubmitting, hasThrownToday, recordTrash } = useTrash();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRecordTrash = async () => {
    const res = await recordTrash("general");
    if (res.success) {
      setFeedback({ type: "success", text: "¡Basura registrada! Se ha sumado +1 punto a tu cuenta." });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: "error", text: res.error || "No se pudo registrar la basura." });
      setTimeout(() => setFeedback(null), 4000);
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
              Acción voluntaria (máx. 1 vez al día por persona). Sumas{" "}
              <strong className="text-emerald-700 font-semibold">+1 punto</strong> directo.
            </p>
          </div>
        </div>

        <button
          onClick={handleRecordTrash}
          disabled={isSubmitting || hasThrownToday}
          className={`w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 ${
            hasThrownToday
              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              : "bg-[#31405F] hover:bg-[#194F6B] text-white disabled:opacity-50"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registrando...</span>
            </>
          ) : hasThrownToday ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Ya registrada hoy</span>
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              <span>He tirado la basura</span>
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 animate-fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-amber-50 border border-amber-200 text-amber-900"
          }`}
        >
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{feedback.text}</span>
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
