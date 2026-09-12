"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { shoppingService } from "@/services/shoppingService";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import type { ShoppingItem } from "@/types";

export function useShopping() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  const fetchItems = useCallback(async () => {
    try {
      const data = await shoppingService.getItems(DEFAULT_HOUSEHOLD_ID);
      setItems(data);
    } catch (err) {
      console.error("[useShopping] Error fetching items:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and Supabase Realtime subscription
  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      try {
        const data = await shoppingService.getItems(DEFAULT_HOUSEHOLD_ID);
        if (isMounted) {
          setItems(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[useShopping] Error loading items in effect:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadItems();

    const channel = supabase
      .channel("pisopro-shopping-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items" },
        () => {
          void loadItems();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Derived filtered lists
  const pendingItems = useMemo(() => {
    return items.filter((item) => !item.completed);
  }, [items]);

  const completedItems = useMemo(() => {
    return items.filter((item) => item.completed);
  }, [items]);

  // Add Item
  const addItem = useCallback(
    async (name: string, quantity: string = "1"): Promise<boolean> => {
      if (!currentUser || !name.trim()) return false;

      const created = await shoppingService.createItem({
        household_id: DEFAULT_HOUSEHOLD_ID,
        name: name.trim(),
        quantity: quantity.trim(),
        added_by: currentUser.id,
      });

      if (created) {
        setItems((prev) => [created, ...prev.filter((i) => i.id !== created.id)]);
        return true;
      }
      return false;
    },
    [currentUser]
  );

  // Toggle Item (Completed <-> Pending)
  const toggleItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      const targetItem = items.find((i) => i.id === itemId);
      if (!targetItem) return false;

      const newCompleted = !targetItem.completed;
      const boughtById = newCompleted ? currentUser?.id : undefined;

      setActionLoading(itemId);

      // Optimistic update
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                completed: newCompleted,
                bought_by: newCompleted ? currentUser?.id : undefined,
                updated_at: new Date().toISOString(),
              }
            : i
        )
      );

      try {
        const success = await shoppingService.toggleItemStatus(
          itemId,
          newCompleted,
          boughtById
        );
        if (!success) {
          // Rollback on failure
          void fetchItems();
        }
        return success;
      } catch (err) {
        console.error("[useShopping] Error toggling item:", err);
        void fetchItems();
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [items, currentUser, fetchItems]
  );

  // Delete Item
  const deleteItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      setActionLoading(itemId);

      // Optimistic delete
      setItems((prev) => prev.filter((i) => i.id !== itemId));

      try {
        const success = await shoppingService.deleteItem(itemId);
        if (!success) {
          void fetchItems();
        }
        return success;
      } catch (err) {
        console.error("[useShopping] Error deleting item:", err);
        void fetchItems();
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [fetchItems]
  );

  // Clear all completed items
  const clearCompleted = useCallback(async (): Promise<boolean> => {
    // Optimistic clear
    setItems((prev) => prev.filter((i) => !i.completed));

    try {
      const success = await shoppingService.clearCompleted(DEFAULT_HOUSEHOLD_ID);
      if (!success) {
        void fetchItems();
      }
      return success;
    } catch (err) {
      console.error("[useShopping] Error clearing completed items:", err);
      void fetchItems();
      return false;
    }
  }, [fetchItems]);

  return {
    items,
    pendingItems,
    completedItems,
    isLoading,
    actionLoading,
    addItem,
    toggleItem,
    deleteItem,
    clearCompleted,
    refresh: fetchItems,
  };
}
