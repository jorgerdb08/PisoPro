"use client";

import React from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { FLAT_RULES } from "@/lib/constants";

export function HouseRulesCard() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
          <span>Normas y Acuerdos de Convivencia</span>
        </h3>
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          <span>Acuerdo común</span>
        </span>
      </div>

      <div className="space-y-2.5">
        {FLAT_RULES.map((rule) => (
          <div
            key={rule.id}
            data-testid={`rule-card-${rule.id}`}
            className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs transition-all hover:border-emerald-500/30"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-base">
              {rule.icon}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground truncate">
                  {rule.title}
                </h4>
                <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground capitalize">
                  {rule.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {rule.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
