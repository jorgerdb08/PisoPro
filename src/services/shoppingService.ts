import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import type { ShoppingItem } from "@/types";

interface DbTableClient<T> {
  select: (cols?: string) => {
    eq: (col: string, val: unknown) => {
      order: (
        col: string,
        opts?: { ascending?: boolean }
      ) => Promise<{ data: T[] | null; error: { message: string } | null }>;
    } & Promise<{ data: T[] | null; error: { message: string } | null }>;
    order: (
      col: string,
      opts?: { ascending?: boolean }
    ) => Promise<{ data: T[] | null; error: { message: string } | null }>;
    single: () => Promise<{ data: T | null; error: { message: string } | null }>;
  } & Promise<{ data: T[] | null; error: { message: string } | null }>;
  insert: (values: unknown) => {
    select: () => {
      single: () => Promise<{ data: T | null; error: { message: string } | null }>;
    };
  } & Promise<{ data: unknown; error: { message: string } | null }>;
  update: (values: unknown) => {
    eq: (
      col: string,
      val: unknown
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
  delete: () => {
    eq: (
      col: string,
      val: unknown
    ) => {
      eq: (
        col2: string,
        val2: unknown
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
    } & Promise<{ data: unknown; error: { message: string } | null }>;
  };
}

function getTableClient<T = unknown>(table: string): DbTableClient<T> {
  const supabase = getSupabaseBrowserClient();
  return (supabase.from as unknown as (t: string) => DbTableClient<T>)(table);
}

export const shoppingService = {
  /**
   * Obtiene todos los artículos de la lista de la compra del hogar
   */
  async getItems(householdId: string = DEFAULT_HOUSEHOLD_ID): Promise<ShoppingItem[]> {
    const table = getTableClient<ShoppingItem>("shopping_items");
    const { data, error } = await table
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[shoppingService] Error fetching shopping items:", error);
      return [];
    }

    return (data || []) as ShoppingItem[];
  },

  /**
   * Añade un nuevo artículo a la lista de la compra
   */
  async createItem(data: {
    household_id?: string;
    name: string;
    quantity?: string;
    added_by: string;
  }): Promise<ShoppingItem | null> {
    const table = getTableClient<ShoppingItem>("shopping_items");
    const payload = {
      household_id: data.household_id || DEFAULT_HOUSEHOLD_ID,
      name: data.name.trim(),
      quantity: (data.quantity || "1").trim(),
      added_by: data.added_by,
      completed: false,
    };

    const { data: created, error } = await table.insert(payload).select().single();

    if (error) {
      console.error("[shoppingService] Error creating shopping item:", error);
      return null;
    }

    return created as ShoppingItem;
  },

  /**
   * Cambia el estado de un artículo (comprado o pendiente)
   */
  async toggleItemStatus(
    itemId: string,
    completed: boolean,
    boughtBy?: string
  ): Promise<boolean> {
    const table = getTableClient("shopping_items");
    const updatePayload: Record<string, unknown> = {
      completed,
      bought_by: completed ? boughtBy || null : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await table.update(updatePayload).eq("id", itemId);

    if (error) {
      console.error("[shoppingService] Error toggling item status:", error);
      return false;
    }

    return true;
  },

  /**
   * Elimina un artículo de la lista
   */
  async deleteItem(itemId: string): Promise<boolean> {
    const table = getTableClient("shopping_items");
    const { error } = await table.delete().eq("id", itemId);

    if (error) {
      console.error("[shoppingService] Error deleting shopping item:", error);
      return false;
    }

    return true;
  },

  /**
   * Limpia todos los artículos completados del hogar
   */
  async clearCompleted(householdId: string = DEFAULT_HOUSEHOLD_ID): Promise<boolean> {
    const table = getTableClient("shopping_items");
    const { error } = await table
      .delete()
      .eq("household_id", householdId)
      .eq("completed", true);

    if (error) {
      console.error("[shoppingService] Error clearing completed items:", error);
      return false;
    }

    return true;
  },
};
