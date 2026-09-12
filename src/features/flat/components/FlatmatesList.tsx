"use client";

import React from "react";
import { Shield, Bed, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlatmateScore } from "@/services/flatService";

interface FlatmatesListProps {
  scores: FlatmateScore[];
}

export function FlatmatesList({ scores }: FlatmatesListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Bed className="h-3.5 w-3.5 text-emerald-600" />
          <span>Compañeros y Habitaciones</span>
        </h3>
        <span className="text-[11px] font-semibold text-muted-foreground">
          3 compañeros
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {scores.map((mate, index) => {
          const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";

          return (
            <div
              key={mate.userId}
              data-testid={`flatmate-card-${mate.name.toLowerCase()}`}
              className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs transition-all hover:border-emerald-500/30"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl text-base font-black text-white shadow-xs",
                    mate.color
                  )}
                >
                  {mate.name[0]}
                </div>

                {/* Info */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground">
                      {mate.name}
                    </span>
                    {mate.role === "admin" && (
                      <span className="inline-flex items-center gap-0.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Shield className="h-2.5 w-2.5" />
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>Habitación {mate.roomNumber}</span>
                    <span>·</span>
                    <span className="text-[11px]">{mate.roomName}</span>
                  </p>
                </div>
              </div>

              {/* Leaderboard stats */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className="text-xs font-black text-foreground flex items-center justify-end gap-1">
                    <span>{medal}</span>
                    <span>{mate.points} pts</span>
                  </span>
                  <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                    <span>{mate.completedTasks} tareas</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
