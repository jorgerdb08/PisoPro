import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import type { Message } from "@/types";

interface DbTableClient<T> {
  select: (cols?: string) => {
    eq: (col: string, val: unknown) => {
      order: (
        col: string,
        opts?: { ascending?: boolean }
      ) => {
        limit: (n: number) => Promise<{ data: T[] | null; error: { message: string } | null }>;
      } & Promise<{ data: T[] | null; error: { message: string } | null }>;
    } & Promise<{ data: T[] | null; error: { message: string } | null }>;
    order: (
      col: string,
      opts?: { ascending?: boolean }
    ) => {
      limit: (n: number) => Promise<{ data: T[] | null; error: { message: string } | null }>;
    } & Promise<{ data: T[] | null; error: { message: string } | null }>;
    single: () => Promise<{ data: T | null; error: { message: string } | null }>;
  } & Promise<{ data: T[] | null; error: { message: string } | null }>;
  insert: (values: unknown) => {
    select: () => {
      single: () => Promise<{ data: T | null; error: { message: string } | null }>;
    };
  } & Promise<{ data: unknown; error: { message: string } | null }>;
  delete: () => {
    eq: (
      col: string,
      val: unknown
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
}

function getTableClient<T = unknown>(table: string): DbTableClient<T> {
  const supabase = getSupabaseBrowserClient();
  return (supabase.from as unknown as (t: string) => DbTableClient<T>)(table);
}

export const chatService = {
  /**
   * Obtiene los mensajes del chat del piso ordenados cronológicamente
   */
  async getMessages(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    limit: number = 100
  ): Promise<Message[]> {
    const table = getTableClient<Message>("messages");
    const { data, error } = await table
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("[chatService] Error fetching messages:", error);
      return [];
    }

    return (data || []) as Message[];
  },

  /**
   * Envía un nuevo mensaje al chat
   */
  async sendMessage(data: {
    household_id?: string;
    user_id: string;
    content: string;
  }): Promise<Message | null> {
    const table = getTableClient<Message>("messages");
    const payload = {
      household_id: data.household_id || DEFAULT_HOUSEHOLD_ID,
      user_id: data.user_id,
      content: data.content.trim(),
    };

    const { data: created, error } = await table.insert(payload).select().single();

    if (error) {
      console.error("[chatService] Error sending message:", error);
      return null;
    }

    return created as Message;
  },

  /**
   * Elimina un mensaje por su ID
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    const table = getTableClient("messages");
    const { error } = await table.delete().eq("id", messageId);

    if (error) {
      console.error("[chatService] Error deleting message:", error);
      return false;
    }

    return true;
  },
};
