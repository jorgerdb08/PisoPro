import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_HOUSEHOLD_ID, FLATMATES } from "@/lib/constants";
import type { Task } from "@/types";

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
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
}

function getTableClient<T = unknown>(table: string): DbTableClient<T> {
  const supabase = getSupabaseBrowserClient();
  return (supabase.from as unknown as (t: string) => DbTableClient<T>)(table);
}

export const choresService = {
  /**
   * Obtiene todas las tareas del hogar actual
   */
  async getTasks(householdId: string = DEFAULT_HOUSEHOLD_ID): Promise<Task[]> {
    const table = getTableClient<Task>("tasks");
    const { data, error } = await table
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[choresService] Error fetching tasks:", error);
      return [];
    }

    return (data || []) as Task[];
  },

  /**
   * Cambia el estado de una tarea (pending / completed) y registra puntos si se completa
   */
  async toggleTaskStatus(
    taskId: string,
    newStatus: "pending" | "completed",
    userId?: string,
    points: number = 1
  ): Promise<boolean> {
    const table = getTableClient<Task>("tasks");

    const { error: updateError } = await table
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (updateError) {
      console.error("[choresService] Error updating task status:", updateError);
      return false;
    }

    // Si se marca como completada y hay usuario, registramos la finalización
    if (newStatus === "completed" && userId) {
      const completionsTable = getTableClient("task_completions");
      const { error: logError } = await completionsTable.insert({
        task_id: taskId,
        completed_by: userId,
        points_awarded: points,
      });

      if (logError) {
        console.warn("[choresService] Error logging task completion points:", logError);
      }
    }

    return true;
  },

  /**
   * Rotación semanal justa de tareas entre los compañeros (Jorge -> Samuel -> David -> Jorge)
   */
  async rotateChores(
    householdId: string = DEFAULT_HOUSEHOLD_ID
  ): Promise<{ success: boolean; rotatedCount: number }> {
    const tasks = await this.getTasks(householdId);

    if (tasks.length === 0) {
      return { success: true, rotatedCount: 0 };
    }

    const flatmateIds = FLATMATES.map((f) => f.id);
    const table = getTableClient<Task>("tasks");
    let rotatedCount = 0;

    for (const task of tasks) {
      const currentIndex = task.assigned_user_id
        ? flatmateIds.indexOf(task.assigned_user_id)
        : -1;

      // Calcular el siguiente compañero en el ciclo
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % flatmateIds.length : 0;
      const nextUserId = flatmateIds[nextIndex];

      const { error } = await table
        .update({
          assigned_user_id: nextUserId,
          status: "pending", // Reiniciar a pendiente para el nuevo ciclo
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (!error) {
        rotatedCount++;
      }
    }

    return { success: true, rotatedCount };
  },

  /**
   * Reasigna manualmente una tarea a un compañero (función de admin)
   */
  async reassignTask(taskId: string, newUserId: string): Promise<boolean> {
    const table = getTableClient<Task>("tasks");
    const { error } = await table
      .update({
        assigned_user_id: newUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (error) {
      console.error("[choresService] Error reassigning task:", error);
      return false;
    }

    return true;
  },

  /**
   * Crea una nueva tarea en el piso
   */
  async createTask(
    taskData: Omit<Task, "id" | "created_at" | "updated_at">
  ): Promise<Task | null> {
    const table = getTableClient<Task>("tasks");
    const { data, error } = await table
      .insert({
        household_id: taskData.household_id || DEFAULT_HOUSEHOLD_ID,
        title: taskData.title,
        description: taskData.description || null,
        category: taskData.category || "general",
        points: taskData.points || 1,
        frequency: taskData.frequency || "weekly",
        assigned_user_id: taskData.assigned_user_id || null,
        status: taskData.status || "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("[choresService] Error creating task:", error);
      return null;
    }

    return data as Task;
  },

  /**
   * Elimina una tarea
   */
  async deleteTask(taskId: string): Promise<boolean> {
    const table = getTableClient<Task>("tasks");
    const { error } = await table.delete().eq("id", taskId);

    if (error) {
      console.error("[choresService] Error deleting task:", error);
      return false;
    }

    return true;
  },
};
