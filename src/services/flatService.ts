import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_HOUSEHOLD_ID, FLATMATES, FLAT_INFO, FLAT_RULES, EMERGENCY_CONTACTS } from "@/lib/constants";
import type { Household } from "@/types";

interface DbTableClient<T> {
  select: (cols?: string) => {
    eq: (col: string, val: unknown) => Promise<{ data: T[] | null; error: { message: string } | null }>;
    single: () => Promise<{ data: T | null; error: { message: string } | null }>;
  } & Promise<{ data: T[] | null; error: { message: string } | null }>;
}

function getTableClient<T = unknown>(table: string): DbTableClient<T> {
  const supabase = getSupabaseBrowserClient();
  return (supabase.from as unknown as (t: string) => DbTableClient<T>)(table);
}

export interface FlatmateScore {
  userId: string;
  name: "Jorge" | "Samuel" | "David";
  role: "admin" | "member";
  color: string;
  roomNumber: number;
  roomName: string;
  points: number;
  completedTasks: number;
}

export const flatService = {
  /**
   * Obtiene la información del hogar desde la base de datos
   */
  async getHousehold(householdId: string = DEFAULT_HOUSEHOLD_ID): Promise<Household | null> {
    const table = getTableClient<Household>("households");
    const { data, error } = await table.select("*").eq("id", householdId);

    if (error || !data || data.length === 0) {
      return {
        id: DEFAULT_HOUSEHOLD_ID,
        name: FLAT_INFO.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return data[0] as Household;
  },

  /**
   * Calcula el ranking de puntos y tareas completadas de cada compañero
   */
  async getLeaderboard(): Promise<FlatmateScore[]> {
    interface TaskCompletionRow {
      completed_by: string;
      points_awarded: number;
    }

    const table = getTableClient<TaskCompletionRow>("task_completions");
    const { data, error } = await table.select("completed_by, points_awarded");

    const scoresMap = new Map<string, { points: number; count: number }>();
    FLATMATES.forEach((f) => scoresMap.set(f.id, { points: 0, count: 0 }));

    if (!error && data) {
      data.forEach((row) => {
        const current = scoresMap.get(row.completed_by);
        if (current) {
          current.points += Number(row.points_awarded || 0);
          current.count += 1;
        }
      });
    }

    const scores: FlatmateScore[] = FLATMATES.map((f) => {
      const room = FLAT_INFO.rooms.find((r) => r.occupantId === f.id);
      const score = scoresMap.get(f.id) || { points: 0, count: 0 };
      return {
        userId: f.id,
        name: f.name,
        role: f.role,
        color: f.color,
        roomNumber: room?.number || 1,
        roomName: room?.name || "Habitación",
        points: score.points,
        completedTasks: score.count,
      };
    });

    // Ordenar de mayor a menor puntuación
    return scores.sort((a, b) => b.points - a.points);
  },

  /**
   * Devuelve las normas de convivencia preconfiguradas
   */
  getRules() {
    return FLAT_RULES;
  },

  /**
   * Devuelve los contactos útiles y emergencias
   */
  getEmergencyContacts() {
    return EMERGENCY_CONTACTS;
  },

  /**
   * Devuelve los detalles del piso (WiFi, casero, dirección)
   */
  getFlatDetails() {
    return FLAT_INFO;
  },
};
