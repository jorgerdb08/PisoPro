"use client";

import React from "react";
import { Check, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FLATMATES } from "@/lib/constants";
import { detectShoppingCategory, getShoppingCategoryMeta } from "../categorizer";
import type { ShoppingItem } from "@/types";

interface ShoppingItemRowProps {
  item: ShoppingItem;
  isLoading?: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ShoppingItemRow({
  item,
  isLoading,
  onToggle,
  onDelete,
}: ShoppingItemRowProps) {
  const addedByUser = FLATMATES.find((f) => f.id === item.added_by);
  const boughtByUser = item.bought_by
    ? FLATMATES.find((f) => f.id === item.bought_by)
    : null;

  const category = detectShoppingCategory(item.name);
  const categoryMeta = getShoppingCategoryMeta(category);

  return (
    <div
      data-testid={`shopping-item-${item.id}`}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all",
        item.completed
          ? "border-border/40 bg-secondary/30 opacity-70"
          : "border-border/80 bg-card hover:border-emerald-500/30 hover:shadow-sm"
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
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all active:scale-90",
            item.completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-muted-foreground/40 hover:border-emerald-500 bg-background"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : item.completed ? (
            <Check className="h-4 w-4 stroke-[3]" />
          ) : null}
        </button>

        {/* Item Info */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-sm font-semibold transition-all truncate",
                item.completed
                  ? "text-muted-foreground line-through decoration-emerald-500/60 decoration-2"
                  : "text-foreground"
              )}
            >
              {item.name}
            </span>

            {/* Quantity Badge */}
            {item.quantity && (
              <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-secondary-foreground">
                {item.quantity}
              </span>
            )}

            {/* Category Pill */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                categoryMeta.color
              )}
            >
              <span>{categoryMeta.icon}</span>
              <span className="hidden sm:inline">{categoryMeta.label}</span>
            </span>
          </div>

          {/* Subtitle / User info */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {item.completed && boughtByUser ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                Comprado por {boughtByUser.name}
              </span>
            ) : (
              addedByUser && (
                <span>
                  Pedido por <strong className="font-semibold">{addedByUser.name}</strong>
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Delete Action Button */}
      <button
        type="button"
        data-testid={`delete-item-${item.id}`}
        disabled={isLoading}
        onClick={() => onDelete(item.id)}
        aria-label="Eliminar producto"
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
