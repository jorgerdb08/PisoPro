"use client";

import React, { useState } from "react";
import { X, Plus, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUICK_SHOPPING_PRESETS } from "@/lib/constants";

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, quantity: string) => Promise<boolean>;
}

export function CreateItemModal({
  isOpen,
  onClose,
  onAdd,
}: CreateItemModalProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Por favor escribe el nombre del producto.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await onAdd(name.trim(), quantity.trim() || "1");
      if (success) {
        setName("");
        setQuantity("1");
        onClose();
      } else {
        setError("No se pudo añadir el producto. Inténtalo de nuevo.");
      }
    } catch {
      setError("Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPreset = (presetName: string, presetQuantity: string) => {
    setName(presetName);
    setQuantity(presetQuantity);
  };

  return (
    <div
      data-testid="create-item-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-border/80 bg-card p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Añadir a la Compra</h2>
              <p className="text-xs text-muted-foreground">Comparte lo que hace falta en casa</p>
            </div>
          </div>
          <button
            type="button"
            data-testid="close-create-item-modal"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="py-4 border-b border-border/60">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Habituales en el piso:</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_SHOPPING_PRESETS.slice(0, 6).map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset.name, preset.quantity)}
                className="shrink-0 rounded-full border border-border/80 bg-secondary/70 px-2.5 py-1 text-xs font-medium hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-600 transition-colors"
              >
                + {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="item-name"
              className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Producto *
            </label>
            <input
              id="item-name"
              type="text"
              data-testid="item-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Leche desnatada, Manzanas..."
              autoFocus
              className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="item-quantity"
              className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Cantidad / Formato
            </label>
            <input
              id="item-quantity"
              type="text"
              data-testid="item-quantity-input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ej: 1 pack, 2 kg, 6 briks..."
              className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              data-testid="item-submit-btn"
              disabled={isSubmitting || !name.trim()}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </div>
              ) : (
                "Añadir a la lista"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
