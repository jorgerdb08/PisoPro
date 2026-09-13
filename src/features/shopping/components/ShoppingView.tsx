"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  ShoppingCart,
  History,
  Trash2,
  Loader2,
  Megaphone,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopping } from "../useShopping";
import { useAuth } from "@/features/auth/AuthContext";
import { chatService } from "@/services/chatService";
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import { ShoppingItemRow } from "./ShoppingItemRow";
import { CreateItemModal } from "./CreateItemModal";
import { ShoppingAlertModal } from "./ShoppingAlertModal";
import { cn } from "@/lib/utils";

export function ShoppingView() {
  const { currentUser } = useAuth();
  const {
    pendingItems,
    completedItems,
    isLoading,
    actionLoading,
    addItem,
    toggleItem,
    deleteItem,
    clearCompleted,
  } = useShopping();

  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickAddName, setQuickAddName] = useState("");
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "info" } | null>(
    null
  );

  // Filter items based on activeTab and searchQuery
  const displayedItems = useMemo(() => {
    const baseList = activeTab === "pending" ? pendingItems : completedItems;

    if (!searchQuery.trim()) return baseList;

    const q = searchQuery.toLowerCase();
    return baseList.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.quantity && item.quantity.toLowerCase().includes(q))
    );
  }, [activeTab, pendingItems, completedItems, searchQuery]);

  // Quick inline add
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddName.trim()) return;

    setIsQuickAdding(true);
    try {
      await addItem(quickAddName.trim(), "1");
      setQuickAddName("");
    } finally {
      setIsQuickAdding(false);
    }
  };

  // Enviar aviso al chat del piso
  const handleSendAlert = async (itemName: string, shouldAddToList: boolean): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      // 1. Añadir a la lista si se solicita y no está ya pendiente
      if (shouldAddToList) {
        const alreadyExists = pendingItems.some(
          (i) => i.name.toLowerCase() === itemName.toLowerCase()
        );
        if (!alreadyExists) {
          await addItem(itemName, "1");
        }
      }

      // 2. Enviar mensaje de alerta al Chat del Piso
      const messageContent = `📢 [AVISO DE COMPRA] ${currentUser.name}: ¡No queda ${itemName} en el piso!`;
      await chatService.sendMessage({
        household_id: DEFAULT_HOUSEHOLD_ID,
        user_id: currentUser.id,
        content: messageContent,
      });

      // 3. Feedback en pantalla
      setFeedbackMsg({
        type: "success",
        text: `Aviso enviado al chat del piso: "¡No queda ${itemName}!"`,
      });
      setTimeout(() => setFeedbackMsg(null), 4500);

      return true;
    } catch (err) {
      console.error("[ShoppingView] Error sending alert:", err);
      return false;
    }
  };

  // Alerta rápida desde una fila existente
  const handleQuickItemAlert = async (itemName: string) => {
    await handleSendAlert(itemName, false);
  };

  const handleClearCompleted = async () => {
    if (completedItems.length === 0) return;
    setIsClearing(true);
    try {
      await clearCompleted();
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#31405F]/10 text-[#31405F]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#607283]">
          Cargando lista de la compra...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 max-w-2xl mx-auto w-full">
      {/* Header & Main Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#31405F] text-white shadow-xs">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Lista de la Compra
            </h1>
            <p className="text-xs text-slate-500">
              {pendingItems.length === 0
                ? "Todo al día en el piso"
                : `${pendingItems.length} producto${pendingItems.length === 1 ? "" : "s"} por comprar`}
            </p>
          </div>
        </div>

        {/* Acciones principales: Avisar y Añadir */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsAlertModalOpen(true)}
            title="Mandar aviso de que falta algo urgente"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200/80 shadow-2xs transition-colors"
          >
            <Megaphone className="h-3.5 w-3.5 text-amber-600" />
            <span>Avisar</span>
          </button>

          <button
            type="button"
            data-testid="open-create-item-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#31405F] hover:bg-[#194F6B] text-white shadow-xs transition-colors active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Añadir</span>
          </button>
        </div>
      </div>

      {/* Banner de Feedback al Enviar Avisos */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-center justify-between animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold ml-2"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Input de Añadido Rápido Directo */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={quickAddName}
            onChange={(e) => setQuickAddName(e.target.value)}
            placeholder="Añadir a la lista... (ej. Leche, Papel higiénico)"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#194F6B] focus:outline-none focus:ring-1 focus:ring-[#194F6B]/20 shadow-2xs transition-all"
          />
        </div>
        <Button
          type="submit"
          disabled={isQuickAdding || !quickAddName.trim()}
          className="h-9.5 rounded-2xl bg-[#31405F] hover:bg-[#194F6B] text-white text-xs font-semibold px-4 shadow-2xs disabled:opacity-50"
        >
          {isQuickAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
        </Button>
      </form>

      {/* Selector de Pestañas: Por Comprar vs Historial */}
      <div className="grid grid-cols-2 rounded-2xl border border-slate-200/80 bg-slate-100 p-1 text-xs font-medium">
        <button
          type="button"
          data-testid="tab-pending-items"
          onClick={() => setActiveTab("pending")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl py-2 transition-all font-semibold",
            activeTab === "pending"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Por Comprar</span>
          {pendingItems.length > 0 && (
            <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
              {pendingItems.length}
            </span>
          )}
        </button>

        <button
          type="button"
          data-testid="tab-completed-items"
          onClick={() => setActiveTab("completed")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl py-2 transition-all font-semibold",
            activeTab === "completed"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          <History className="h-3.5 w-3.5" />
          <span>Historial</span>
          {completedItems.length > 0 && (
            <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
              {completedItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Buscador minimalista opcional */}
      {(pendingItems.length > 3 || completedItems.length > 3) && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            data-testid="search-shopping-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en la lista..."
            className="w-full rounded-xl border border-slate-200/80 bg-white pl-9 pr-3.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#194F6B] focus:outline-none focus:ring-1 focus:ring-[#194F6B]/20"
          />
        </div>
      )}

      {/* Acción de Limpiar Historial */}
      {activeTab === "completed" && completedItems.length > 0 && (
        <div className="flex justify-end pt-0.5">
          <button
            type="button"
            data-testid="clear-completed-btn"
            disabled={isClearing}
            onClick={handleClearCompleted}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:underline transition-all"
          >
            {isClearing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Vaciar historial ({completedItems.length})</span>
          </button>
        </div>
      )}

      {/* Lista de Productos */}
      <div className="space-y-2">
        {displayedItems.length > 0 ? (
          displayedItems.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              isLoading={actionLoading === item.id}
              onToggle={toggleItem}
              onDelete={deleteItem}
              onQuickAlert={handleQuickItemAlert}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-2 bg-white">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              {activeTab === "pending" ? (
                <ShoppingCart className="h-5 w-5" />
              ) : (
                <History className="h-5 w-5" />
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {activeTab === "pending"
                ? searchQuery
                  ? "No se encontraron productos"
                  : "No hay productos pendientes"
                : "El historial está vacío"}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {activeTab === "pending"
                ? searchQuery
                  ? "Prueba con otro término de búsqueda."
                  : "¡Todo al día en el piso! Añade lo que se vaya acabando."
                : "Los productos que marques como comprados aparecerán aquí."}
            </p>
          </div>
        )}
      </div>

      {/* Modal para Añadir Producto con Detalles */}
      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAdd={addItem}
      />

      {/* Modal de Alerta Urgente al Piso */}
      <ShoppingAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onSendAlert={handleSendAlert}
      />
    </div>
  );
}

