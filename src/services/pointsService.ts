import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_HOUSEHOLD_ID, FLATMATES } from "@/lib/constants";
import type { PointTransaction, UserContributionStats } from "@/types";
import { getIsoWeekMonday } from "./cleaningService";
import type { DateRangeFilter } from "./trashService";
export type { DateRangeFilter };

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

function getLocalItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export const pointsService = {
  /**
   * Obtiene las transacciones del libro mayor de puntos
   */
  async getPointTransactions(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    filter: DateRangeFilter = "week"
  ): Promise<PointTransaction[]> {
    const supabase = getClient();
    try {
      let query = supabase
        .from("point_transactions")
        .select("id, household_id, user_id, points, type, reference_id, description, created_at, profiles(name)")
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
      if (!error && Array.isArray(data)) {
        return data.map((row: unknown) => {
          const r = row as {
            id: string;
            household_id: string;
            user_id: string;
            points: number;
            type: "cleaning" | "helping" | "trash" | "admin_adjustment";
            reference_id: string | null;
            description: string;
            created_at: string;
            profiles?: { name: "Jorge" | "Samuel" | "David" } | null;
          };
          return {
            id: r.id,
            household_id: r.household_id,
            user_id: r.user_id,
            user_name: r.profiles?.name,
            points: r.points,
            type: r.type,
            reference_id: r.reference_id || undefined,
            description: r.description,
            created_at: r.created_at,
          };
        });
      }

    } catch {
      // fallback
    }

    // Fallback local
    const transactions = getLocalItem<PointTransaction[]>("pisopro_point_transactions", []);
    const now = new Date();
    if (filter === "week") {
      const weekMonday = getIsoWeekMonday(now);
      return transactions.filter((t) => t.created_at >= `${weekMonday}T00:00:00Z`);
    } else if (filter === "month") {
      const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return transactions.filter((t) => t.created_at >= firstDayMonth);
    }

    return transactions;
  },

  /**
   * Calcula las estadísticas de contribución detalladas por usuario
   */
  async getContributionStats(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    filter: DateRangeFilter = "week"
  ): Promise<UserContributionStats[]> {
    const transactions = await this.getPointTransactions(householdId, filter);

    const statsMap = new Map<string, UserContributionStats>();
    FLATMATES.forEach((f) => {
      statsMap.set(f.id, {
        user_id: f.id,
        user_name: f.name,
        cleaning_points: 0,
        helping_points: 0,
        trash_points: 0,
        total_points: 0,
        zones_completed: 0,
        helps_given: 0,
        trash_count: 0,
      });
    });

    transactions.forEach((tx) => {
      const stats = statsMap.get(tx.user_id);
      if (!stats) return;

      stats.total_points += tx.points;

      if (tx.type === "cleaning") {
        stats.cleaning_points += tx.points;
        stats.zones_completed += 1;
      } else if (tx.type === "helping") {
        stats.helping_points += tx.points;
        stats.helps_given += 1;
      } else if (tx.type === "trash") {
        stats.trash_points += tx.points;
        stats.trash_count += 1;
      } else if (tx.type === "admin_adjustment") {
        // Adjustments affect total_points directly
      }
    });

    return Array.from(statsMap.values());
  },
};
