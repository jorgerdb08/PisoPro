"use client";

import React, { useState } from "react";
import { cleaningService } from "@/services/cleaningService";
import { DEFAULT_HOUSEHOLD_ID, FLATMATES } from "@/lib/constants";
import type { ZoneAssignment } from "@/types";
import { ZoneIcon } from "./ZoneIcon";
import {
  Settings2,
  Sliders,
  Users,
  ListTodo,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"points" | "reassign" | "tasks" | "reset">("points");
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

  const handleResetAll = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await cleaningService.adminResetAllCleaningData(DEFAULT_HOUSEHOLD_ID);
      if (res.success) {
        setFeedback({
          type: "success",
          text: "Se han restablecido todos los datos a cero. Las zonas vuelven a estar 'Sin asignar' y el sorteo está disponible.",
        });
        await onRefresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Error al restablecer datos." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#31405F]/10 text-[#31405F] flex items-center justify-center">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Administración de Limpieza
              </h3>
              <p className="text-[11px] text-slate-500">
                Panel exclusivo de Jorge (Admin)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas de gestión */}
        <div className="flex border-b border-slate-200 mb-3.5 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("points");
              setFeedback(null);
            }}
            className={`pb-2 px-2.5 border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "points"
                ? "border-[#31405F] text-[#31405F]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Puntos</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("reassign");
              setFeedback(null);
            }}
            className={`pb-2 px-2.5 border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "reassign"
                ? "border-[#31405F] text-[#31405F]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Reasignar</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("tasks");
              setFeedback(null);
            }}
            className={`pb-2 px-2.5 border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "tasks"
                ? "border-[#31405F] text-[#31405F]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Checklists</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("reset");
              setFeedback(null);
            }}
            className={`pb-2 px-2.5 border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === "reset"
                ? "border-rose-600 text-rose-700"
                : "border-transparent text-slate-500 hover:text-rose-600"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`p-2.5 rounded-xl mb-3 text-xs font-medium flex items-center space-x-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Contenido según pestaña */}
        <div className="overflow-y-auto space-y-3.5 pr-1 flex-1">
          {activeTab === "points" && (
            <div className="space-y-3">
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
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-white text-slate-700 rounded-lg border border-slate-200/60 shadow-2xs">
                        <ZoneIcon slug={zone.zone_slug} className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-slate-800">
                          {zone.zone_name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Actual: {zone.zone_default_points} pts (ayuda: {zone.zone_help_points} pt)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex flex-col">
                        <label className="text-[10px] text-slate-400 font-medium">Puntos</label>
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
                          className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-center"
                        />
                      </div>
                      <button
                        onClick={() => handleSavePoints(zone.zone_id)}
                        disabled={isSubmitting}
                        className="self-end px-3 py-1.5 bg-[#31405F] hover:bg-[#194F6B] text-white text-xs font-medium rounded-lg disabled:opacity-50"
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
            <div className="space-y-3">
              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Las reasignaciones manuales son excepciones administrativas registradas en auditoría.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Usuario a Reasignar
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                >
                  {FLATMATES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nueva Zona Asignada
                </label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                >
                  {assignments.map((z) => (
                    <option key={z.zone_id} value={z.zone_id}>
                      {z.zone_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Motivo de la Reasignación
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Cambio acordado por viaje"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <button
                onClick={handleReassign}
                disabled={isSubmitting}
                className="w-full py-2 bg-[#31405F] hover:bg-[#194F6B] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : "Aplicar Reasignación"}
              </button>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-3.5">
              {/* Formulario para añadir nueva tarea */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="text-xs font-semibold text-slate-800">
                  Añadir Nueva Tarea a Checklist
                </p>
                <div className="flex gap-2">
                  <select
                    value={taskZoneId}
                    onChange={(e) => setTaskZoneId(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    {assignments.map((z) => (
                      <option key={z.zone_id} value={z.zone_id}>
                        {z.zone_name}
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
                    className="px-3 py-1.5 bg-[#31405F] hover:bg-[#194F6B] text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </div>
              </div>

              {/* Lista actual de tareas agrupadas por zona */}
              <div className="space-y-2.5">
                {assignments.map((zone) => (
                  <div key={zone.zone_id} className="border border-slate-200 rounded-xl p-3 bg-white">
                    <h5 className="font-semibold text-xs text-slate-800 mb-2 flex items-center space-x-1.5">
                      <ZoneIcon slug={zone.zone_slug} className="w-3.5 h-3.5 text-slate-600" />
                      <span>{zone.zone_name}</span>
                    </h5>
                    <div className="space-y-1">
                      {zone.tasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 rounded-lg text-xs text-slate-700"
                        >
                          <span>{t.title}</span>
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            disabled={isSubmitting}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reset" && (
            <div className="space-y-3 p-1">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Restablecer sistema de pruebas a cero</span>
                </div>
                <p className="text-rose-700 text-[11px] leading-relaxed">
                  Esta opción restablece el sorteo inicial a estado sin asignar y elimina los registros de prueba de tareas, ayudas, basura y transacciones.
                </p>
              </div>

              <button
                onClick={handleResetAll}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isSubmitting ? "Restableciendo..." : "Restablecer todo a cero"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
