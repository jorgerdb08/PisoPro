"use client";

import React, { useState } from "react";
import { useChores } from "@/features/chores/useChores";
import { useAuth } from "@/features/auth/AuthContext";
import { ChoreCard } from "./ChoreCard";
import { CreateChoreModal } from "./CreateChoreModal";
import {
  RotateCw,
  Plus,
  CheckCircle2,
  ListTodo,
  Sparkles,
  Loader2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ChoresView() {
  const { currentUser } = useAuth();
  const {
    tasks,
    isLoading,
    actionLoading,
    myTasks,
    completedTasks,
    toggleTask,
    rotateAllChores,
    assignTask,
    createNewTask,
    removeTask,
    refreshTasks,
  } = useChores();

  const [activeTab, setActiveTab] = useState<"mine" | "all" | "completed">("mine");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const isAdmin = currentUser?.role === "admin";

  const totalCount = tasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleRotate = async () => {
    if (!window.confirm("¿Seguro que deseas rotar las tareas semanales entre todos los compañeros?")) {
      return;
    }
    setIsRotating(true);
    setNotice(null);
    try {
      const res = await rotateAllChores();
      if (res.success) {
        setNotice({
          type: "success",
          text: `¡Rotación semanal completada! Se han reasignado ${res.rotatedCount} tareas.`,
        });
      }
    } catch {
      setNotice({ type: "error", text: "Error al rotar las tareas." });
    } finally {
      setIsRotating(false);
    }
  };

  const displayedTasks =
    activeTab === "mine"
      ? myTasks
      : activeTab === "completed"
      ? completedTasks
      : tasks;

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner & Progress */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-secondary/30 p-5 shadow-sm backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-bold tracking-tight">
                Tareas del Hogar
              </h2>
              <p className="text-muted-foreground text-xs">
                Rotación y puntos de limpieza del piso
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void refreshTasks()}
            title="Actualizar lista"
            className="text-muted-foreground hover:text-foreground flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 transition-colors"
          >
            <RotateCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Progreso de la semana</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {completedCount} de {totalCount} ({progressPercent}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Admin Quick Action Toolbar */}
        {isAdmin && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              data-testid="rotate-chores-btn"
              disabled={isRotating}
              onClick={handleRotate}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-secondary/80 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors active:scale-95 disabled:opacity-50"
            >
              <RotateCw className={cn("h-3.5 w-3.5 text-emerald-600", isRotating && "animate-spin")} />
              <span>{isRotating ? "Rotando..." : "Rotar Semana"}</span>
            </button>

            <button
              type="button"
              data-testid="create-chore-btn"
              onClick={() => setIsCreateOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nueva Tarea</span>
            </button>
          </div>
        )}
      </div>

      {/* Notice Message */}
      {notice && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl p-3 text-xs font-medium animate-in fade-in-50",
            notice.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          )}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Tab Selectors */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-secondary/80 border border-border/60">
        <button
          type="button"
          data-testid="tab-my-chores"
          onClick={() => setActiveTab("mine")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
            activeTab === "mine"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Hoy te toca ({myTasks.length})</span>
        </button>

        <button
          type="button"
          data-testid="tab-all-chores"
          onClick={() => setActiveTab("all")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
            activeTab === "all"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ListTodo className="h-3.5 w-3.5" />
          <span>Todas ({tasks.length})</span>
        </button>

        <button
          type="button"
          data-testid="tab-completed-chores"
          onClick={() => setActiveTab("completed")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
            activeTab === "completed"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Hechas ({completedTasks.length})</span>
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center text-xs text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span>Cargando tareas del piso...</span>
          </div>
        ) : displayedTasks.length > 0 ? (
          displayedTasks.map((task) => (
            <ChoreCard
              key={task.id}
              task={task}
              isCurrentUserAssigned={task.assigned_user_id === currentUser?.id}
              isAdmin={isAdmin}
              isActionLoading={actionLoading === task.id}
              onToggle={toggleTask}
              onReassign={assignTask}
              onDelete={removeTask}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 p-8 text-center space-y-2 bg-card/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="text-foreground text-sm font-bold">
              {activeTab === "mine"
                ? "¡Estás al día!"
                : activeTab === "completed"
                ? "Ninguna tarea completada todavía"
                : "No hay tareas registradas"}
            </h4>
            <p className="text-muted-foreground text-xs max-w-xs">
              {activeTab === "mine"
                ? "No tienes tareas pendientes asignadas en este momento. ¡Disfruta del descanso!"
                : activeTab === "completed"
                ? "Las tareas que se vayan marcando como hechas aparecerán aquí."
                : "Pulsa en 'Nueva Tarea' para empezar a organizar el piso."}
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateChoreModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={createNewTask}
      />
    </div>
  );
}
