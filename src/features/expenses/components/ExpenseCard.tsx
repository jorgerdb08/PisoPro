"use client";

import React from "react";
import { EXPENSE_CATEGORIES, FLATMATES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Trash2, ArrowRight } from "lucide-react";
import type { ExpenseItem } from "@/features/expenses/calculations";
import { ExpenseCategoryIcon } from "./ExpenseCategoryIcon";

interface ExpenseCardProps {
  expense: ExpenseItem;
  currentUserId?: string;
  isAdmin?: boolean;
  onDelete?: (expenseId: string) => void;
}

export function ExpenseCard({
  expense,
  currentUserId,
  isAdmin = false,
  onDelete,
}: ExpenseCardProps) {
  const isSettlement = expense.category === "settlement";

  const category =
    EXPENSE_CATEGORIES.find((c) => c.value === expense.category) ||
    EXPENSE_CATEGORIES[0]!;

  const payer = FLATMATES.find((f) => f.id === expense.paid_by);
  const canDelete = isAdmin || expense.paid_by === currentUserId;

  const formattedAmount = Number(expense.amount).toFixed(2).replace(".", ",") + " €";

  return (
    <div
      data-testid={`expense-card-${expense.id}`}
      className={cn(
        "group relative flex flex-col gap-2 rounded-2xl border p-4 transition-all duration-200",
        isSettlement
          ? "border-[#094152]/30 bg-[#094152]/5"
          : "border-[#BFC6CC]/60 bg-white hover:border-[#194F6B]/40 hover:shadow-xs"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {/* Category SVG Icon Badge */}
          <ExpenseCategoryIcon category={expense.category} size="md" />

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold text-[#607283] uppercase tracking-wider">
                {category.label}
              </span>
              <span className="text-[#607283] text-[10px]">·</span>
              <span className="text-[#607283] text-[10px]">
                {expense.date || "Hoy"}
              </span>
            </div>
            <h4 className="text-[#31405F] text-sm font-bold tracking-tight mt-0.5">
              {expense.description}
            </h4>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <span
            className={cn(
              "text-base font-extrabold tracking-tight",
              isSettlement ? "text-[#094152]" : "text-[#31405F]"
            )}
          >
            {formattedAmount}
          </span>
        </div>
      </div>

      {/* Payer and Participants Split */}
      <div className="flex items-center justify-between border-t border-[#BFC6CC]/30 pt-2 text-xs">
        <div className="flex items-center gap-1.5 text-[11px] text-[#607283]">
          <span>Pagado por</span>
          <span className="font-semibold text-[#31405F] flex items-center gap-1">
            <span
              className={cn(
                "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white",
                payer?.color || "bg-slate-700"
              )}
            >
              {payer?.name.charAt(0) || "?"}
            </span>
            <span>{payer?.id === currentUserId ? "ti" : payer?.name || "Compañero"}</span>
          </span>
        </div>

        {/* Participants summary */}
        {!isSettlement && expense.participants.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-[#607283]">
            <span>Reparto ({expense.participants.length}):</span>
            <div className="flex -space-x-1">
              {expense.participants.map((p) => {
                const flatmate = FLATMATES.find((f) => f.id === p.user_id);
                if (!flatmate) return null;
                return (
                  <span
                    key={p.user_id}
                    title={`${flatmate.name}: ${Number(p.share_amount).toFixed(2)} €`}
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white border border-white ring-1 ring-white",
                      flatmate.color
                    )}
                  >
                    {flatmate.name.charAt(0)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {isSettlement && (
          <div className="text-[#094152] font-medium text-[10px] flex items-center gap-1">
            <span>Liquidación de cuenta</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </div>
        )}

        {/* Delete action */}
        {canDelete && onDelete && (
          <button
            type="button"
            data-testid={`delete-expense-${expense.id}`}
            onClick={() => onDelete(expense.id)}
            className="text-[#607283] hover:text-[#8B4B5B] opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg hover:bg-[#C995A2]/15"
            title="Eliminar gasto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
