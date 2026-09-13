"use client";

import React, { useState } from "react";
import { X, Megaphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShoppingAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendAlert: (item: string, shouldAddToList: boolean) => Promise<boolean>;
}

const COMMON_URGENT_PRESETS = [
  "Papel higiénico",
  "Leche",
  "Aceite de oliva",
  "Bolsas de basura",
  "Lavavajillas",
  "Café",
  "Huevos",
  "Detergente ropa",
];

export function ShoppingAlertModal({
  isOpen,
  onClose,
  onSendAlert,
}: ShoppingAlertModalProps) {
  const [itemName, setItemName] = useState("");
  const [shouldAddToList, setShouldAddToList] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError("Indica qué producto se ha terminado.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await onSendAlert(itemName.trim(), shouldAddToList);
      if (success) {
        setItemName("");
        onClose();
      } else {
        setError("No se pudo enviar el aviso. Inténtalo de nuevo.");
      }
    } catch {
      setError("Error inesperado al enviar el aviso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPreset = (preset: string) => {
    setItemName(preset);
    setError(null);
  };

  return (
    <div
      data-testid="shopping-alert-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-[#BFC6CC]/60 bg-white p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#BFC6CC]/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Megaphone className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#31405F]">Avisar al Piso</h2>
              <p className="text-xs text-[#607283]">
                Alerta inmediata para avisar que falta algo urgente
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="close-alert-modal"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#607283] hover:bg-[#F4F7F8] hover:text-[#31405F] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Presets rápidos */}
        <div className="py-4 border-b border-[#BFC6CC]/40">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#607283] mb-2 block">
            Selección rápida frecuente:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_URGENT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`rounded-xl border px-2.5 py-1 text-xs font-medium transition-all ${
                  itemName.toLowerCase() === preset.toLowerCase()
                    ? "border-amber-500 bg-amber-500/15 text-amber-800 font-bold"
                    : "border-[#BFC6CC]/60 bg-[#F4F7F8] text-[#31405F] hover:bg-[#E6EFF8] hover:border-[#194F6B]/30"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#31405F]">
              ¿Qué se ha terminado?
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
                setError(null);
              }}
              placeholder="Ej: Papel higiénico, Leche, Aceite..."
              autoFocus
              className="w-full rounded-xl border border-[#BFC6CC]/80 bg-white px-3.5 py-2.5 text-sm text-[#31405F] placeholder:text-[#607283]/60 focus:border-[#194F6B] focus:outline-none focus:ring-1 focus:ring-[#194F6B]/20"
            />
          </div>

          {/* Opción para añadir a la lista automáticamente */}
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#31405F] font-medium select-none">
            <input
              type="checkbox"
              checked={shouldAddToList}
              onChange={(e) => setShouldAddToList(e.target.checked)}
              className="h-4 w-4 rounded border-[#BFC6CC] text-[#31405F] focus:ring-[#31405F]"
            />
            <span>Añadir también a la lista de la compra si no está</span>
          </label>

          {error && (
            <p className="text-xs font-medium text-rose-600 animate-fade-in">
              {error}
            </p>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl border-[#BFC6CC]/80 text-[#607283] hover:bg-[#F4F7F8] text-xs font-semibold h-10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !itemName.trim()}
              className="flex-1 rounded-xl bg-[#31405F] hover:bg-[#194F6B] text-white text-xs font-bold h-10 shadow-xs gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Megaphone className="h-4 w-4" />
                  <span>Mandar aviso</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
