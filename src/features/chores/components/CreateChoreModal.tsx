"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, CheckSquare } from "lucide-react";
import { CHORE_CATEGORIES, FLATMATES, DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import type { Task } from "@/types";

interface CreateChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: Omit<Task, "id" | "created_at" | "updated_at">) => Promise<unknown>;
}

export function CreateChoreModal({ isOpen, onClose, onCreate }: CreateChoreModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("cleaning");
  const [points, setPoints] = useState<number>(3);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "biweekly" | "monthly">("weekly");
  const [assignedUserId, setAssignedUserId] = useState<string>(FLATMATES[0]!.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Por favor, introduce un título para la tarea.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate({
        household_id: DEFAULT_HOUSEHOLD_ID,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        points,
        frequency,
        assigned_user_id: assignedUserId,
        status: "pending",
      });

      // Reset form
      setTitle("");
      setDescription("");
      onClose();
    } catch {
      setError("Error al crear la tarea. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="create-chore-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl border border-border/80 bg-background/95 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-foreground text-base font-bold">Nueva Tarea del Piso</h3>
              <p className="text-muted-foreground text-xs">Añadir al reparto semanal</p>
            </div>
          </div>
          <button
            type="button"
            data-testid="create-chore-close"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label htmlFor="chore-title" className="text-foreground font-semibold">
              Título de la tarea *
            </label>
            <input
              id="chore-title"
              data-testid="chore-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Fregar el horno, Limpiar terraza..."
              className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="chore-desc" className="text-foreground font-semibold">
              Descripción / Notas (opcional)
            </label>
            <textarea
              id="chore-desc"
              data-testid="chore-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre cómo debe quedar..."
              className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category & Points Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="chore-category" className="text-foreground font-semibold">
                Zona / Categoría
              </label>
              <select
                id="chore-category"
                data-testid="chore-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
              >
                {CHORE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="chore-points" className="text-foreground font-semibold">
                Puntos asignados
              </label>
              <select
                id="chore-points"
                data-testid="chore-points-select"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
              >
                <option value={1}>1 pt (Fácil)</option>
                <option value={2}>2 pts (Normal)</option>
                <option value={3}>3 pts (Importante)</option>
                <option value={4}>4 pts (Exigente)</option>
                <option value={5}>5 pts (Muy pesada)</option>
              </select>
            </div>
          </div>

          {/* Frequency & Assignee Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="chore-freq" className="text-foreground font-semibold">
                Frecuencia
              </label>
              <select
                id="chore-freq"
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as "daily" | "weekly" | "biweekly" | "monthly")
                }
                className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
              >
                <option value="daily">Diaria</option>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="chore-assignee" className="text-foreground font-semibold">
                Asignar este turno a
              </label>
              <select
                id="chore-assignee"
                data-testid="chore-assignee-select"
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
              >
                {FLATMATES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.role === "admin" ? "Admin" : "Miembro"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border/80 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="chore-submit-btn"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Guardando..." : "Crear Tarea"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
