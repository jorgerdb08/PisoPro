"use client";

import React from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { FLAT_RULES } from "@/lib/constants";

export function HouseRulesCard() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#607283] flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-[#094152]" />
          <span>Normas y Acuerdos de Convivencia</span>
        </h3>
        <span className="text-[11px] font-semibold text-[#094152] flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          <span>Acuerdo común</span>
        </span>
      </div>

      <div className="space-y-2.5">
        {FLAT_RULES.map((rule) => (
          <div
            key={rule.id}
            data-testid={`rule-card-${rule.id}`}
            className="flex items-start gap-3 rounded-2xl border border-[#BFC6CC]/60 bg-white p-3.5 shadow-xs transition-all hover:border-[#194F6B]/40"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7F8] text-base">
              {rule.icon}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#31405F] truncate">
                  {rule.title}
                </h4>
                <span className="rounded-md bg-[#F4F7F8] border border-[#BFC6CC]/40 px-2 py-0.5 text-[10px] font-semibold text-[#607283] capitalize">
                  {rule.category}
                </span>
              </div>
              <p className="text-xs text-[#607283] leading-relaxed">
                {rule.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
