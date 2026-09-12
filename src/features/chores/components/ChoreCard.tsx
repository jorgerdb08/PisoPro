"use client";

import React from "react";
import { Check, CheckCircle2, Clock, MoreVertical, Trash2, UserCheck } from "lucide-react";
import { CHORE_CATEGORIES, FLATMATES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface ChoreCardProps {
  task: Task;
  isCurrentUserAssigned: boolean;
  isAdmin?: boolean;
  isActionLoading?: boolean;
  onToggle: (taskId: string) => void;
  onReassign?: (taskId: string, userId: string) => void;
  onDelete?: (taskId: string) => void;
}

export function ChoreCard({
  task,
  isCurrentUserAssigned,
  isAdmin = false,
  isActionLoading = false,
  onToggle,
  onReassign,
  onDelete,
}: ChoreCardProps) {
  const isCompleted = task.status === "completed";

  const category =
    CHORE_CATEGORIES.find((c) => c.value === task.category) ||
    CHORE_CATEGORIES[CHORE_CATEGORIES.length - 1]!;

  const assignedFlatmate = FLATMATES.find((f) => f.id === task.assigned_user_id);

  const [showAdminMenu, setShowAdminMenu] = React.useState(false);

  return (
    <div
      data-testid={`chore-card-${task.id}`}
      className={cn(
        "group relative flex items-start gap-3 rounded-2xl border p-3.5 transition-all duration-150",
        isCompleted
          ? "border-slate-200 bg-slate-50/70 text-slate-400"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs",
        isCurrentUserAssigned && !isCompleted && "border-slate-900 ring-1 ring-slate-900 shadow-xs"
      )}
    >
      {/* Interactive Completion Toggle Button */}
      <button
        type="button"
        data-testid={`chore-toggle-${task.id}`}
        disabled={isActionLoading}
        onClick={() => onToggle(task.id)}
        aria-label={isCompleted ? "Marcar como pendiente" : "Marcar como completada"}
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all active:scale-90 mt-0.5",
          isCompleted
            ? "border-slate-900 bg-slate-900 text-white shadow-xs"
            : "border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 text-slate-400"
        )}
      >
        {isCompleted ? (
          <Check className="h-4 w-4 stroke-[2.5]" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-slate-300 group-hover:bg-slate-500 transition-colors" />
        )}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Category Chip */}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold border",
              category.color
            )}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </span>

          {/* Points Badge */}
          <span className="inline-flex items-center rounded-md bg-secondary/80 px-1.5 py-0.5 text-[10px] font-bold text-foreground border border-border/60">
            +{task.points} {task.points === 1 ? "pt" : "pts"}
          </span>

          {/* Frequency */}
          {task.frequency && (
            <span className="text-muted-foreground inline-flex items-center gap-0.5 text-[10px]">
              <Clock className="h-2.5 w-2.5" />
              <span>{task.frequency === "daily" ? "Diaria" : "Semanal"}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h4
          className={cn(
            "text-sm font-semibold tracking-tight mt-1 transition-all",
            isCompleted
              ? "line-through text-muted-foreground"
              : "text-foreground"
          )}
        >
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="text-muted-foreground text-xs line-clamp-1 mt-0.5">
            {task.description}
          </p>
        )}

        {/* Assigned User Footer */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40 text-xs">
          <div className="flex items-center gap-1.5">
            {assignedFlatmate ? (
              <div className="flex items-center gap-1 text-[11px] font-medium">
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white",
                    assignedFlatmate.color
                  )}
                >
                  {assignedFlatmate.name.charAt(0)}
                </span>
                <span
                  className={cn(
                    isCurrentUserAssigned
                      ? "text-slate-900 font-semibold"
                      : "text-slate-500"
                  )}
                >
                  {isCurrentUserAssigned ? "Te toca a ti" : assignedFlatmate.name}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 text-[11px] italic">Sin asignar</span>
            )}
          </div>

          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Hecho
            </span>
          )}
        </div>
      </div>

      {/* Admin Actions Dropdown / Trigger */}
      {isAdmin && (
        <div className="relative shrink-0">
          <button
            type="button"
            data-testid={`chore-admin-menu-${task.id}`}
            onClick={() => setShowAdminMenu((prev) => !prev)}
            className="text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {showAdminMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAdminMenu(false)}
              />
              <div className="absolute right-0 top-8 z-50 w-44 rounded-2xl border border-border/80 bg-background/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in-50 zoom-in-95">
                <div className="text-muted-foreground px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                  Reasignar a
                </div>
                {FLATMATES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setShowAdminMenu(false);
                      onReassign?.(task.id, f.id);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors",
                      task.assigned_user_id === f.id
                        ? "bg-secondary font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>{f.name}</span>
                  </button>
                ))}
                {onDelete && (
                  <>
                    <div className="my-1 border-t border-border/60" />
                    <button
                      type="button"
                      data-testid={`chore-delete-${task.id}`}
                      onClick={() => {
                        setShowAdminMenu(false);
                        onDelete(task.id);
                      }}
                      className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Eliminar tarea</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
