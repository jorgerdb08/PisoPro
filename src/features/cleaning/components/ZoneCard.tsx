"use client";

import React, { useState } from "react";
import type { ZoneAssignment } from "@/types";
import { ZoneIcon } from "./ZoneIcon";
import { Lock, Check, Handshake, AlertCircle, Loader2 } from "lucide-react";

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
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
        isOwner
          ? "bg-gradient-to-b from-white to-[#F6F9FA] border-slate-300"
          : isHelper
          ? "bg-gradient-to-b from-white to-amber-50/30 border-amber-200"
          : "bg-white border-slate-200/90"
      }`}
    >
      {/* Encabezado de la Zona */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100/90 text-slate-700 rounded-xl border border-slate-200/60 flex items-center justify-center">
            <ZoneIcon slug={zone.zone_slug} className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                {zone.zone_name}
              </h3>
              {zone.is_completed && (
                <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Completada</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <span>Responsable:</span>
              <span
                className={`font-medium ${
                  isOwner ? "text-[#31405F] font-semibold" : "text-slate-800"
                }`}
              >
                {zone.assigned_user_name || "Sin asignar"}
              </span>
              {isOwner && (
                <span className="bg-[#31405F]/10 text-[#31405F] text-[10px] font-bold px-1.5 py-0.2 rounded-md ml-1">
                  Tú
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Puntos de recompensa */}
        <div className="text-right flex-shrink-0">
          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
            +{zone.zone_default_points} pts
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">al completar</p>
        </div>
      </div>

      {/* Progreso */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5 font-medium">
          <span>
            {zone.checked_count} de {zone.total_count} tareas
          </span>
          <span className={zone.is_completed ? "text-emerald-700 font-bold" : "text-slate-700"}>
            {percentage}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              zone.is_completed
                ? "bg-emerald-600"
                : isOwner
                ? "bg-[#31405F]"
                : "bg-slate-300"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Ayudantes activos */}
      {zone.helpers && zone.helpers.length > 0 && (
        <div className="mb-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-slate-700">
            <Handshake className="w-3.5 h-3.5 text-slate-500" />
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
          <span className="text-[10px] text-slate-600 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
            +1 pt cada ayudante
          </span>
        </div>
      )}

      {/* Checklist de Tareas */}
      <div className="space-y-1.5 mb-3.5">
        {zone.tasks.map((task) => {
          const isToggling = loadingTaskId === task.id;
          const isDone = Boolean(task.is_checked);
          return (
            <div
              key={task.id}
              onClick={async () => {
                if (!canEdit || isDone || isToggling) return;
                setLoadingTaskId(task.id);
                try {
                  await onToggleTask(task.id, zone.zone_id);
                } finally {
                  setLoadingTaskId(null);
                }
              }}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                !canEdit
                  ? "bg-slate-50/50 border-slate-200/70 text-slate-400 cursor-not-allowed"
                  : isDone
                  ? "bg-emerald-50/40 border-emerald-200/80 text-slate-500 line-through cursor-default"
                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 cursor-pointer shadow-2xs"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  checked={isDone}
                  disabled={!canEdit || isDone || isToggling}
                  readOnly
                  className={`w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 ${
                    !canEdit
                      ? "opacity-40 cursor-not-allowed"
                      : isDone
                      ? "cursor-default text-emerald-600"
                      : "cursor-pointer"
                  }`}
                />
                <span className={isDone ? "text-slate-400" : "font-medium"}>
                  {task.title}
                </span>
              </div>
              {isToggling ? (
                <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
              ) : !canEdit ? (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              ) : isDone ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Pie de la Tarjeta / Bloqueo y Acciones de Ayuda */}
      {!canEdit ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-normal text-slate-500">
              Esta zona no te corresponde esta semana ({zone.assigned_user_name || "Sin asignar"}).
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
              className="w-full sm:w-auto px-3 py-1.5 bg-[#31405F] hover:bg-[#194F6B] text-white font-medium rounded-lg text-xs transition-colors flex items-center justify-center space-x-1"
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>Ayudar (+1 pt)</span>
            </button>
          )}
        </div>
      ) : isOwner ? (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {hasOpenHelpRequest ? (
            <span className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Petición de ayuda activa ({zone.helpers.length} voluntario/s)</span>
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
              className="text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <Handshake className="w-3.5 h-3.5 text-slate-600" />
              <span>Pedir ayuda</span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Zona completada esta semana</span>
            </span>
          )}

          <span className="text-[11px] text-slate-400">
            Semana del {zone.week_start}
          </span>
        </div>
      ) : isHelper ? (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
          <span className="flex items-center gap-1.5">
            <Handshake className="w-3.5 h-3.5 text-slate-500" />
            <span>Colaborando como voluntario</span>
          </span>
          <span className="font-semibold text-emerald-700">+1 pt al completarse</span>
        </div>
      ) : null}
    </div>
  );
};
