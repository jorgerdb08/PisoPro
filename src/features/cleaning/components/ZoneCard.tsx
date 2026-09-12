"use client";

import React, { useState } from "react";
import type { ZoneAssignment } from "@/types";

interface ZoneCardProps {
  zone: ZoneAssignment;
  currentUserId?: string;
  onToggleTask: (taskId: string, zoneId: string) => Promise<{ success: boolean; error?: string }>;
  onRequestHelp: (zoneId: string) => Promise<{ success: boolean; error?: string }>;
  onAcceptHelp: (helpRequestId: string) => Promise<{ success: boolean; error?: string }>;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({
  zone,
  currentUserId,
  onToggleTask,
  onRequestHelp,
  onAcceptHelp,
}) => {
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [helpActionLoading, setHelpActionLoading] = useState<boolean>(false);

  const isOwner = Boolean(currentUserId && zone.assigned_user_id === currentUserId);
  const isHelper = Boolean(
    currentUserId && zone.helpers.some((h) => h.helper_id === currentUserId)
  );
  const canEdit = isOwner || isHelper;

  const percentage =
    zone.total_count > 0
      ? Math.round((zone.checked_count / zone.total_count) * 100)
      : 0;

  const hasOpenHelpRequest = Boolean(
    zone.help_request && zone.help_request.status === "open"
  );

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
        isOwner
          ? "bg-gradient-to-br from-white via-sky-50/40 to-slate-50 border-sky-300 ring-2 ring-sky-200/60"
          : isHelper
          ? "bg-gradient-to-br from-white to-amber-50/40 border-amber-300 ring-1 ring-amber-200"
          : "bg-white border-slate-200"
      }`}
    >
      {/* Encabezado de la Zona */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-3xl p-2 bg-slate-100 rounded-xl">
            {zone.zone_icon}
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {zone.zone_name.toUpperCase()}
              </h3>
              {zone.is_completed && (
                <span className="text-xs px-2 py-0.5 font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ✓ COMPLETADA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <span>Responsable:</span>
              <span
                className={`font-semibold ${
                  isOwner
                    ? "text-sky-700 underline decoration-sky-400"
                    : "text-slate-800"
                }`}
              >
                {zone.assigned_user_name || "Sin asignar"}
              </span>
              {isOwner && (
                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1">
                  TÚ
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Puntos de recompensa */}
        <div className="text-right flex-shrink-0">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#31405F]/10 text-[#31405F]">
            +{zone.zone_default_points} pts
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">al completar</p>
        </div>
      </div>

      {/* Progreso */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
          <span>
            {zone.checked_count} / {zone.total_count} tareas
          </span>
          <span className={zone.is_completed ? "text-emerald-600 font-bold" : ""}>
            {percentage}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              zone.is_completed
                ? "bg-emerald-500"
                : isOwner
                ? "bg-[#194F6B]"
                : "bg-slate-400"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Ayudantes activos */}
      {zone.helpers && zone.helpers.length > 0 && (
        <div className="mb-3 px-3 py-2 bg-amber-50/80 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-amber-900">
            <span>🤝</span>
            <span>
              <strong className="font-semibold">Ayudando:</strong>{" "}
              {zone.helpers
                .map((h) =>
                  h.helper_id === currentUserId
                    ? "Tú"
                    : h.helper_name || "Compañero"
                )
                .join(", ")}
            </span>
          </div>
          <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
            +1 pt cada ayudante
          </span>
        </div>
      )}

      {/* Checklist de Tareas */}
      <div className="space-y-2 mb-4">
        {zone.tasks.map((task) => {
          const isToggling = loadingTaskId === task.id;
          return (
            <div
              key={task.id}
              onClick={async () => {
                if (!canEdit || isToggling) return;
                setLoadingTaskId(task.id);
                try {
                  await onToggleTask(task.id, zone.zone_id);
                } finally {
                  setLoadingTaskId(null);
                }
              }}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-sm transition-all ${
                !canEdit
                  ? "bg-slate-50/70 border-slate-200 text-slate-400 cursor-not-allowed"
                  : task.is_checked
                  ? "bg-emerald-50/60 border-emerald-200 text-slate-700 line-through cursor-pointer"
                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 cursor-pointer shadow-2xs"
              }`}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={task.is_checked || false}
                  disabled={!canEdit || isToggling}
                  readOnly
                  className={`w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 ${
                    !canEdit ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                  }`}
                />
                <span className={task.is_checked ? "text-slate-400" : ""}>
                  {task.title}
                </span>
              </div>
              {isToggling ? (
                <span className="text-xs text-slate-400 animate-spin">⏳</span>
              ) : !canEdit ? (
                <span className="text-xs text-slate-400" title="Zona no asignada a ti">
                  🔒
                </span>
              ) : task.is_checked ? (
                <span className="text-xs text-emerald-600 font-bold">✓</span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Pie de la Tarjeta / Bloqueo y Acciones de Ayuda */}
      {!canEdit ? (
        <div className="bg-slate-100/90 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-base">🔒</span>
            <span className="font-medium">
              Esta no es tu zona esta semana ({zone.assigned_user_name || "Sin asignar"}).
            </span>
          </div>

          {hasOpenHelpRequest && !isHelper && (
            <button
              onClick={async () => {
                if (!zone.help_request?.id) return;
                setHelpActionLoading(true);
                try {
                  await onAcceptHelp(zone.help_request.id);
                } finally {
                  setHelpActionLoading(false);
                }
              }}
              disabled={helpActionLoading}
              className="w-full sm:w-auto px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center space-x-1"
            >
              <span>🤝 [ AYUDAR ] (+1 pt)</span>
            </button>
          )}
        </div>
      ) : isOwner ? (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {hasOpenHelpRequest ? (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              🚨 Petición de ayuda activa ({zone.helpers.length} ayudantes)
            </span>
          ) : !zone.is_completed ? (
            <button
              onClick={async () => {
                setHelpActionLoading(true);
                try {
                  await onRequestHelp(zone.zone_id);
                } finally {
                  setHelpActionLoading(false);
                }
              }}
              disabled={helpActionLoading}
              className="text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1"
            >
              <span>🤝 ¿Necesitas ayuda? [ PEDIR AYUDA ]</span>
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-700">
              ✓ ¡Gran trabajo! Has completado tu zona.
            </span>
          )}

          <span className="text-[11px] text-slate-400">
            Semana del {zone.week_start}
          </span>
        </div>
      ) : isHelper ? (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-amber-800">
          <span>🤝 Estás colaborando como ayudante en esta zona</span>
          <span className="font-bold">+1 pt al completarse</span>
        </div>
      ) : null}
    </div>
  );
};
