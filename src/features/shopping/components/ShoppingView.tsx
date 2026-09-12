"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  ShoppingCart,
  CheckCircle2,
  Trash2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopping } from "../useShopping";
import { ShoppingItemRow } from "./ShoppingItemRow";
import { CreateItemModal } from "./CreateItemModal";
import { SHOPPING_CATEGORIES } from "@/lib/constants";
import { detectShoppingCategory } from "../categorizer";
import { cn } from "@/lib/utils";

export function ShoppingView() {
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Filter items based on activeTab, searchQuery, and selectedCategory
  const displayedItems = useMemo(() => {
    const baseList = activeTab === "pending" ? pendingItems : completedItems;

    return baseList.filter((item) => {
      // Search filter
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.quantity &&
          item.quantity.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory !== "all") {
        const itemCat = detectShoppingCategory(item.name);
        if (itemCat !== selectedCategory) return false;
      }

      return true;
    });
  }, [activeTab, pendingItems, completedItems, searchQuery, selectedCategory]);

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
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-600">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cargando lista de la compra...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Header Summary & New Item Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Lista de la Compra</span>
            <span className="text-base font-medium text-muted-foreground">🛒</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {pendingItems.length === 0
              ? "¡Todo comprado! La despensa está llena."
              : `${pendingItems.length} producto${pendingItems.length === 1 ? "" : "s"} pendiente${pendingItems.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <Button
          type="button"
          data-testid="open-create-item-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="h-9 gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Añadir</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 rounded-2xl border border-border/80 bg-secondary/40 p-1">
        <button
          type="button"
          data-testid="tab-pending-items"
          onClick={() => setActiveTab("pending")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all",
            activeTab === "pending"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Por Comprar</span>
          {pendingItems.length > 0 && (
            <span className="ml-1 rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
              {pendingItems.length}
            </span>
          )}
        </button>

        <button
          type="button"
          data-testid="tab-completed-items"
          onClick={() => setActiveTab("completed")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all",
            activeTab === "completed"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Comprados</span>
          {completedItems.length > 0 && (
            <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.2 text-[10px] font-bold text-muted-foreground">
              {completedItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar & Category Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            data-testid="search-shopping-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full rounded-xl border border-border/80 bg-card pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Category horizontal scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              selectedCategory === "all"
                ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
                : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            Todos
          </button>
          {SHOPPING_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors flex items-center gap-1",
                selectedCategory === cat.value
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
                  : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Completed Action Button (in Completed tab) */}
      {activeTab === "completed" && completedItems.length > 0 && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            data-testid="clear-completed-btn"
            disabled={isClearing}
            onClick={handleClearCompleted}
            className="flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline active:scale-95 transition-all"
          >
            {isClearing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Limpiar comprados ({completedItems.length})</span>
          </button>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2.5">
        {displayedItems.length > 0 ? (
          displayedItems.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              isLoading={actionLoading === item.id}
              onToggle={toggleItem}
              onDelete={deleteItem}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center space-y-3 bg-secondary/10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              {activeTab === "pending" ? (
                <Sparkles className="h-6 w-6 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                {activeTab === "pending"
                  ? searchQuery || selectedCategory !== "all"
                    ? "No se encontraron productos"
                    : "No hay productos pendientes"
                  : "Aún no hay productos comprados"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {activeTab === "pending"
                  ? searchQuery || selectedCategory !== "all"
                    ? "Prueba a cambiar el término de búsqueda o categoría."
                    : "¡Genial! No hace falta nada en el piso. Añade lo que se vaya acabando."
                  : "Los productos que marques como comprados aparecerán aquí."}
              </p>
            </div>
            {activeTab === "pending" && !searchQuery && selectedCategory === "all" && (
              <Button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Añadir producto
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAdd={addItem}
      />
    </div>
  );
}
