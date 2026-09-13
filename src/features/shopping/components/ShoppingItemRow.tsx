"use client";

import React from "react";
import { Check, Trash2, Loader2, Megaphone, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { FLATMATES } from "@/lib/constants";
import type { ShoppingItem } from "@/types";

interface ShoppingItemRowProps {
  item: ShoppingItem;
  isLoading?: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onQuickAlert?: (name: string) => void;
}

export function ShoppingItemRow({
  item,
  isLoading,
  onToggle,
  onDelete,
  onQuickAlert,
}: ShoppingItemRowProps) {
  const addedByUser = FLATMATES.find((f) => f.id === item.added_by);
  const boughtByUser = item.bought_by
    ? FLATMATES.find((f) => f.id === item.bought_by)
    : null;

  return (
    <div
      data-testid={`shopping-item-${item.id}`}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all shadow-2xs",
        item.completed
          ? "border-[#BFC6CC]/40 bg-[#F4F7F8]/70 opacity-75"
          : "border-[#BFC6CC]/60 bg-white hover:border-[#194F6B]/40"
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Toggle Checkbox */}
        <button
          type="button"
          data-testid={`toggle-item-${item.id}`}
          disabled={isLoading}
          onClick={() => onToggle(item.id)}
          aria-label={item.completed ? "Marcar como pendiente" : "Marcar como comprado"}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all active:scale-90",
            item.completed
              ? "border-[#31405F] bg-[#31405F] text-white"
              : "border-[#BFC6CC] hover:border-[#31405F] bg-white text-transparent"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin text-[#31405F]" />
          ) : item.completed ? (
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          ) : (
            <Check className="h-3.5 w-3.5 stroke-[2.5] opacity-0 group-hover:opacity-30 text-[#31405F]" />
          )}
        </button>

        {/* Item Info */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-sm font-semibold transition-all truncate",
                item.completed
                  ? "text-[#607283] line-through decoration-[#31405F]/40"
                  : "text-[#31405F]"
              )}
            >
              {item.name}
            </span>

            {/* Quantity Badge */}
            {item.quantity && (
              <span className="rounded-md bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {item.quantity}
              </span>
            )}
          </div>

          {/* Subtitle / Flatmate info */}
          <div className="flex items-center gap-2 text-[11px] text-[#607283]">
            {item.completed ? (
              <span>
                Comprado {boughtByUser ? `por ${boughtByUser.name}` : ""}
              </span>
            ) : (
              addedByUser && (
                <span>
                  Pedido por <span className="font-semibold text-slate-700">{addedByUser.name}</span>
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* En pendientes: botón rápido de avisar */}
        {!item.completed && onQuickAlert && (
          <button
            type="button"
            title={`Avisar al piso que falta ${item.name}`}
            onClick={() => onQuickAlert(item.name)}
            className="rounded-xl p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50/80 transition-colors"
          >
            <Megaphone className="h-4 w-4" />
          </button>
        )}

        {/* En historial: botón rápido de volver a pedir */}
        {item.completed && (
          <button
            type="button"
            title="Volver a añadir a la lista de la compra"
            onClick={() => onToggle(item.id)}
            className="rounded-xl p-1.5 text-slate-400 hover:text-[#31405F] hover:bg-[#F4F7F8] transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}

        {/* Botón de eliminar */}
        <button
          type="button"
          data-testid={`delete-item-${item.id}`}
          disabled={isLoading}
          onClick={() => onDelete(item.id)}
          aria-label="Eliminar producto"
          className="rounded-xl p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

