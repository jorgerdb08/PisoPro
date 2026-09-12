import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_HOUSEHOLD_ID, FLATMATES } from "@/lib/constants";
import type { TrashEvent, TrashUserStats } from "@/types";
import { getIsoWeekMonday } from "./cleaningService";

export type DateRangeFilter = "week" | "month" | "all";

interface SupabaseClientAny {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
}

function getClient(): SupabaseClientAny {
  return getSupabaseBrowserClient() as unknown as SupabaseClientAny;
}

export const trashService = {
  /**
   * Registra un evento de tirar la basura (suma 1 punto en point_transactions automáticamente)
   */
  async recordTrash(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    userId: string,
    trashType: string = "general"
  ): Promise<{ success: boolean; error?: string; event_id?: string; points?: number }> {
    const supabase = getClient();
    const { data, error } = await supabase.rpc("rpc_record_trash", {

      p_household_id: householdId,
      p_user_id: userId,
      p_trash_type: trashType,
    });

    if (error) {
      console.error("[trashService] Error recording trash:", error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string; event_id?: string; points?: number };
  },

  /**
   * Obtiene el listado de eventos de basura con filtro temporal
   */
  async getTrashEvents(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    filter: DateRangeFilter = "week"
  ): Promise<TrashEvent[]> {
    const supabase = getClient();
    let query = supabase
      .from("trash_events")

      .select("id, household_id, user_id, trash_type, created_at, profiles(name)")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false });

    const now = new Date();
    if (filter === "week") {
      const weekMonday = getIsoWeekMonday(now);
      query = query.gte("created_at", `${weekMonday}T00:00:00Z`);
    } else if (filter === "month") {
      const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte("created_at", firstDayMonth);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[trashService] Error fetching trash events:", error);
      return [];
    }

    return (data || []).map((row: unknown) => {
      const r = row as {
        id: string;
        household_id: string;
        user_id: string;
        trash_type: string;
        created_at: string;
        profiles?: { name: "Jorge" | "Samuel" | "David" } | null;
      };
      return {
        id: r.id,
        household_id: r.household_id,
        user_id: r.user_id,
        user_name: r.profiles?.name,
        trash_type: r.trash_type,
        created_at: r.created_at,
      };
    });
  },

  /**
   * Obtiene las estadísticas de veces que ha tirado la basura cada usuario
   */
  async getTrashUserStats(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    filter: DateRangeFilter = "week"
  ): Promise<TrashUserStats[]> {
    const events = await this.getTrashEvents(householdId, filter);

    // Inicializar los 3 compañeros con conteo en 0
    const statsMap = new Map<string, { user_id: string; user_name: "Jorge" | "Samuel" | "David"; count: number }>();
    FLATMATES.forEach((f) => {
      statsMap.set(f.id, {
        user_id: f.id,
        user_name: f.name,
        count: 0,
      });
    });

    events.forEach((e) => {
      const current = statsMap.get(e.user_id);
      if (current) {
        current.count += 1;
      }
    });

    return Array.from(statsMap.values());
  },
};
