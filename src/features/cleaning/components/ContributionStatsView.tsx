"use client";

import React from "react";
import { usePoints } from "@/features/cleaning/usePoints";
import type { DateRangeFilter } from "@/services/trashService";
import { BarChart3, Sparkles, Handshake, Trash2, Sliders } from "lucide-react";

export const ContributionStatsView: React.FC = () => {
  const { stats, transactions, filter, setFilter, isLoading } = usePoints();

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-slate-600" />
            <span>Desglose de Contribución</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Puntos auditados por limpieza de zona propia, ayudas voluntarias y basura.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/70 text-xs font-medium self-start sm:self-auto">
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

      {/* Tarjetas de Contribución por Usuario */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Cargando contribución...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.user_id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#31405F]/10 text-[#31405F] flex items-center justify-center font-bold text-xs">
                      {s.user_name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">
                        {s.user_name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {s.user_name === "Jorge" ? "Admin" : "Compañero"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-[#31405F]">
                      {s.total_points}
                    </span>
                    <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                      puntos
                    </span>
                  </div>
                </div>

                {/* Desglose de Puntos */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                      <span>Limpieza zona:</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {s.cleaning_points} pts{" "}
                      <span className="font-normal text-slate-400">
                        ({s.zones_completed})
                      </span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Handshake className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ayudas:</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {s.helping_points} pts{" "}
                      <span className="font-normal text-slate-400">
                        ({s.helps_given})
                      </span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Basura:</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {s.trash_points} pts{" "}
                      <span className="font-normal text-slate-400">
                        ({s.trash_count})
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Total final */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Total</span>
                <span className="text-sm font-bold text-[#31405F]">
                  {s.total_points} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registro de transacciones detalladas */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Libro Mayor de Puntos
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">
            {transactions.length} registros
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No hay transacciones registradas en este periodo.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                    {tx.type === "cleaning" ? (
                      <Sparkles className="w-3.5 h-3.5" />
                    ) : tx.type === "helping" ? (
                      <Handshake className="w-3.5 h-3.5" />
                    ) : tx.type === "trash" ? (
                      <Trash2 className="w-3.5 h-3.5" />
                    ) : (
                      <Sliders className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">
                      {tx.user_name || "Compañero"}
                    </span>
                    <p className="text-[11px] text-slate-500">{tx.description}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatDate(tx.created_at)}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-xs px-2 py-0.5 rounded text-emerald-700 bg-emerald-50 border border-emerald-200/60">
                  +{tx.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
