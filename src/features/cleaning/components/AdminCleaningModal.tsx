"use client";

import React, { useState } from "react";
import { cleaningService } from "@/services/cleaningService";
import { DEFAULT_HOUSEHOLD_ID, FLATMATES } from "@/lib/constants";
import type { ZoneAssignment } from "@/types";

interface AdminCleaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: ZoneAssignment[];
  adminId: string;
  onRefresh: () => Promise<void>;
}

export const AdminCleaningModal: React.FC<AdminCleaningModalProps> = ({
  isOpen,
  onClose,
  assignments,
  adminId,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<"points" | "reassign" | "tasks">("points");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estados para reasignación
  const [selectedUserId, setSelectedUserId] = useState<string>(FLATMATES[0]?.id || "");
  const [selectedZoneId, setSelectedZoneId] = useState<string>(assignments[0]?.zone_id || "");
  const [reassignReason, setReassignReason] = useState<string>("");

  // Estados para puntos
  const [pointsState, setPointsState] = useState<Record<string, { defaultPoints: number; helpPoints: number }>>(() => {
    const initial: Record<string, { defaultPoints: number; helpPoints: number }> = {};
    assignments.forEach((a) => {
      initial[a.zone_id] = {
        defaultPoints: a.zone_default_points,
        helpPoints: a.zone_help_points,
      };
    });
    return initial;
  });

  // Estado para nueva tarea
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [taskZoneId, setTaskZoneId] = useState<string>(assignments[0]?.zone_id || "");

  if (!isOpen) return null;

  const handleSavePoints = async (zoneId: string) => {
    const p = pointsState[zoneId];
    if (!p) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await cleaningService.adminUpdateZonePoints(zoneId, p.defaultPoints, p.helpPoints);
      if (res.success) {
        setFeedback({ type: "success", text: "Puntos actualizados correctamente." });
        await onRefresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Error al actualizar puntos." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedUserId || !selectedZoneId) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await cleaningService.adminReassignZone(
        DEFAULT_HOUSEHOLD_ID,
        adminId,
        selectedUserId,
        selectedZoneId,
        undefined,
        reassignReason || "Reasignación excepcional por el administrador"
      );
      if (res.success) {
        setFeedback({ type: "success", text: "Reasignación guardada y registrada en auditoría." });
        setReassignReason("");
        await onRefresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Error al reasignar zona." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !taskZoneId) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const zone = assignments.find((a) => a.zone_id === taskZoneId);
      const nextIndex = (zone?.tasks.length || 0) + 1;
      const res = await cleaningService.adminAddTask(taskZoneId, newTaskTitle.trim(), nextIndex);
      if (res.success) {
        setFeedback({ type: "success", text: "Tarea añadida a la checklist." });
        setNewTaskTitle("");
        await onRefresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Error al crear tarea." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await cleaningService.adminDeleteTask(taskId);
      if (res.success) {
        setFeedback({ type: "success", text: "Tarea eliminada." });
        await onRefresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Error al eliminar tarea." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">⚙️</span>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Administración de Limpieza
              </h3>
              <p className="text-xs text-slate-500">
                Panel exclusivo de Jorge (Admin)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Pestañas de gestión */}
        <div className="flex border-b border-slate-200 mb-4 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab("points");
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === "points"
                ? "border-[#31405F] text-[#31405F]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Puntuación Zonas
          </button>
          <button
            onClick={() => {
              setActiveTab("reassign");
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === "reassign"
                ? "border-[#31405F] text-[#31405F]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Reasignación Excepcional
          </button>
          <button
            onClick={() => {
              setActiveTab("tasks");
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === "tasks"
                ? "border-[#31405F] text-[#31405F]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Editar Checklists
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-medium ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Contenido según pestaña */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {activeTab === "points" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Ajusta los puntos otorgados por completar cada zona y los puntos para ayudantes.
              </p>
              {assignments.map((zone) => {
                const currentP = pointsState[zone.zone_id] || {
                  defaultPoints: zone.zone_default_points,
                  helpPoints: zone.zone_help_points,
                };
                return (
                  <div
                    key={zone.zone_id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{zone.zone_icon}</span>
                      <div>
                        <p className="font-bold text-xs text-slate-800">
                          {zone.zone_name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Actual: {zone.zone_default_points} pts (ayuda: {zone.zone_help_points} pt)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex flex-col">
                        <label className="text-[10px] text-slate-400 font-semibold">Puntos</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={currentP.defaultPoints}
                          onChange={(e) =>
                            setPointsState({
                              ...pointsState,
                              [zone.zone_id]: {
                                ...currentP,
                                defaultPoints: parseInt(e.target.value) || 1,
                              },
                            })
                          }
                          className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                        />
                      </div>
                      <button
                        onClick={() => handleSavePoints(zone.zone_id)}
                        disabled={isSubmitting}
                        className="self-end px-3 py-1.5 bg-[#31405F] hover:bg-[#194F6B] text-white text-xs font-semibold rounded-lg shadow-2xs disabled:opacity-50"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "reassign" && (
            <div className="space-y-3.5">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                ⚠️ Las reasignaciones manuales son excepciones administrativas. Se guardará un registro con quién hizo el cambio, zona previa, zona nueva y motivo.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Usuario a Reasignar
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                >
                  {FLATMATES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nueva Zona Asignada
                </label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                >
                  {assignments.map((z) => (
                    <option key={z.zone_id} value={z.zone_id}>
                      {z.zone_icon} {z.zone_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo de la Reasignación
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Cambio acordado por viaje de Samuel"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <button
                onClick={handleReassign}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#31405F] hover:bg-[#194F6B] text-white text-xs font-bold rounded-xl shadow transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : "Aplicar Reasignación Excepcional"}
              </button>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-4">
              {/* Formulario para añadir nueva tarea */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <p className="text-xs font-bold text-slate-800">
                  Añadir Nueva Tarea a Checklist
                </p>
                <div className="flex gap-2">
                  <select
                    value={taskZoneId}
                    onChange={(e) => setTaskZoneId(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {assignments.map((z) => (
                      <option key={z.zone_id} value={z.zone_id}>
                        {z.zone_icon} {z.zone_name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Nombre de la tarea..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    onClick={handleAddTask}
                    disabled={isSubmitting || !newTaskTitle.trim()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                  >
                    + Añadir
                  </button>
                </div>
              </div>

              {/* Lista actual de tareas agrupadas por zona */}
              <div className="space-y-3">
                {assignments.map((zone) => (
                  <div key={zone.zone_id} className="border border-slate-200 rounded-xl p-3">
                    <h5 className="font-bold text-xs text-slate-800 mb-2 flex items-center space-x-1.5">
                      <span>{zone.zone_icon}</span>
                      <span>{zone.zone_name}</span>
                    </h5>
                    <div className="space-y-1.5">
                      {zone.tasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 rounded-lg text-xs text-slate-700"
                        >
                          <span>{t.title}</span>
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            disabled={isSubmitting}
                            className="text-rose-500 hover:text-rose-700 font-bold px-1.5"
                            title="Eliminar tarea"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
