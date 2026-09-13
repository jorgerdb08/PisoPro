"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Receipt, Users } from "lucide-react";
import { EXPENSE_CATEGORIES, FLATMATES, DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onCreate: (data: {
    household_id?: string;
    description: string;
    amount: number;
    paid_by: string;
    category?: string;
    notes?: string;
    date?: string;
    participantUserIds: string[];
  }) => Promise<unknown>;
}

export function CreateExpenseModal({
  isOpen,
  onClose,
  currentUserId,
  onCreate,
}: CreateExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("compras");
  const [selectedPaidBy, setSelectedPaidBy] = useState<string | null>(null);
  const effectivePaidBy = selectedPaidBy ?? currentUserId ?? FLATMATES[0]!.id;
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]!);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    FLATMATES.map((f) => f.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount.replace(",", ".")) || 0;
  const sharePerPerson =
    selectedParticipants.length > 0 && parsedAmount > 0
      ? (parsedAmount / selectedParticipants.length).toFixed(2).replace(".", ",")
      : "0,00";

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(userId)) {
        if (prev.length === 1) return prev; // Mantener al menos 1 participante
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Introduce una descripción para el gasto.");
      return;
    }
    if (parsedAmount <= 0) {
      setError("Introduce un importe válido mayor que 0 €.");
      return;
    }
    if (selectedParticipants.length === 0) {
      setError("Selecciona al menos un compañero para el reparto.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate({
        household_id: DEFAULT_HOUSEHOLD_ID,
        description: description.trim(),
        amount: parsedAmount,
        paid_by: effectivePaidBy,
        category,
        date,
        participantUserIds: selectedParticipants,
      });

      // Reset
      setDescription("");
      setAmount("");
      onClose();
    } catch {
      setError("Error al registrar el gasto. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="create-expense-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-[#BFC6CC]/60 bg-white p-5 shadow-2xl backdrop-blur-xl animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#BFC6CC]/40">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#31405F]/10 text-[#31405F]">
              <Receipt className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-[#31405F] text-base font-bold">Registrar Gasto</h3>
              <p className="text-[#607283] text-xs">Reparto automático entre compañeros</p>
            </div>
          </div>
          <button
            type="button"
            data-testid="create-expense-close"
            onClick={onClose}
            className="text-[#607283] hover:text-[#31405F] flex h-8 w-8 items-center justify-center rounded-lg border border-[#BFC6CC]/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {error && (
            <div className="rounded-xl bg-[#C995A2]/15 border border-[#C995A2]/30 p-2.5 text-xs text-[#8B4B5B] font-medium">
              {error}
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="expense-desc" className="text-[#31405F] font-semibold">
              Concepto del gasto *
            </label>
            <input
              id="expense-desc"
              data-testid="expense-desc-input"
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra Mercadona, Factura WiFi..."
              className="w-full rounded-xl border border-[#BFC6CC]/80 bg-white px-3 py-2 text-sm text-[#31405F] placeholder:text-[#607283]/60 focus:border-[#194F6B] focus:outline-none focus:ring-1 focus:ring-[#194F6B]"
            />
          </div>

          {/* Amount and Category Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="expense-amount" className="text-[#31405F] font-semibold">
                Importe (€) *
              </label>
              <input
                id="expense-amount"
                data-testid="expense-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-[#BFC6CC]/80 bg-white px-3 py-2 text-sm font-bold text-[#31405F] placeholder:text-[#607283]/60 focus:border-[#194F6B] focus:outline-none focus:ring-1 focus:ring-[#194F6B]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="expense-category" className="text-[#31405F] font-semibold">
                Categoría
              </label>
              <select
                id="expense-category"
                data-testid="expense-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[#BFC6CC]/80 bg-white px-3 py-2 text-xs text-[#31405F] focus:border-[#194F6B] focus:outline-none"
              >
                {EXPENSE_CATEGORIES.filter(
                  (c) =>
                    c.value !== "settlement" &&
                    // Evitar duplicados en el selector de los alias antiguos
                    c.value !== "groceries" &&
                    c.value !== "utilities" &&
                    c.value !== "dining" &&
                    c.value !== "other"
                ).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paid by & Date Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="expense-payer" className="text-[#31405F] font-semibold">
                ¿Quién lo ha pagado?
              </label>
              <select
                id="expense-payer"
                data-testid="expense-payer-select"
                value={effectivePaidBy}
                onChange={(e) => setSelectedPaidBy(e.target.value)}
                className="w-full rounded-xl border border-[#BFC6CC]/80 bg-white px-3 py-2 text-xs text-[#31405F] focus:border-[#194F6B] focus:outline-none"
              >
                {FLATMATES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.id === currentUserId ? "(Tú)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="expense-date" className="text-[#31405F] font-semibold">
                Fecha
              </label>
              <input
                id="expense-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[#BFC6CC]/80 bg-white px-3 py-2 text-xs text-[#31405F] focus:border-[#194F6B] focus:outline-none"
              />
            </div>
          </div>

          {/* Split Among Section */}
          <div className="space-y-2 pt-1 border-t border-[#BFC6CC]/30">
            <div className="flex items-center justify-between">
              <label className="text-[#31405F] font-semibold flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-[#094152]" />
                <span>Dividir entre compañeros</span>
              </label>
              <span className="text-[#094152] font-bold text-xs">
                {sharePerPerson} € / persona
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {FLATMATES.map((f) => {
                const isSelected = selectedParticipants.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    data-testid={`participant-check-${f.name.toLowerCase()}`}
                    onClick={() => toggleParticipant(f.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-95 text-xs font-semibold gap-1",
                      isSelected
                        ? "border-[#194F6B] bg-[#194F6B]/10 text-[#31405F] shadow-xs"
                        : "border-[#BFC6CC]/60 bg-[#F4F7F8] text-[#607283] opacity-60"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs",
                        f.color
                      )}
                    >
                      {f.name.charAt(0)}
                    </span>
                    <span>{f.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#BFC6CC]/80 py-2 text-xs font-semibold text-[#607283] hover:bg-[#F4F7F8] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="expense-submit-btn"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-[#31405F] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#194F6B] active:scale-95 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Guardando..." : "Guardar Gasto"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
