import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_HOUSEHOLD_ID, CLEANING_ZONES_CONFIG } from "@/lib/constants";


import type {
  CleaningZone,
  CleaningTask,
  CleaningLottery,
  CleaningHelpRequest,
  ZoneAssignment,
  CleaningZoneSlug,
} from "@/types";


/**
 * Retorna la fecha del lunes correspondiente a la semana de la fecha dada (YYYY-MM-DD)
 */
export function getIsoWeekMonday(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Domingo, 1 = Lunes, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

/**
 * Calcula la diferencia en semanas entre dos lunes ISO
 */
export function getElapsedWeeks(baseMondayStr: string, targetMondayStr: string): number {
  const base = new Date(`${baseMondayStr}T00:00:00Z`).getTime();
  const target = new Date(`${targetMondayStr}T00:00:00Z`).getTime();
  const diffMs = target - base;
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Calcula la zona asignada para una semana dada según el orden de rotación:
 * Cocina (0) -> Salón (1) -> Baño (2) -> Cocina (0)
 */
export function calculateRotationZoneOrder(initialOrder: number, elapsedWeeks: number): number {
  return ((initialOrder + (elapsedWeeks % 3)) % 3 + 3) % 3;
}

/**
 * Calcula qué orden inicial corresponde a una zona en una semana dada
 */
export function calculateOriginOrderForZone(targetOrder: number, elapsedWeeks: number): number {
  return ((targetOrder - (elapsedWeeks % 3) + 3) % 3);
}

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

export const cleaningService = {
  /**
   * Consulta el estado del sorteo inicial
   */
  async getLottery(householdId: string = DEFAULT_HOUSEHOLD_ID): Promise<CleaningLottery | null> {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("cleaning_lottery")

      .select("*")
      .eq("household_id", householdId)
      .maybeSingle();

    if (error) {
      console.error("[cleaningService] Error fetching lottery:", error);
      return null;
    }

    return data as CleaningLottery | null;
  },

  /**
   * Ejecuta el sorteo inicial (solo admin, solo una vez)
   */
  async executeLottery(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    adminId: string
  ): Promise<{ success: boolean; error?: string; lottery_id?: string; base_week_start?: string }> {
    const supabase = getClient();
    const { data, error } = await supabase.rpc("rpc_execute_initial_lottery", {
      p_household_id: householdId,
      p_admin_id: adminId,
    });

    if (error) {
      console.warn("[cleaningService] Warning executing lottery RPC, using local fallback:", error);
      return {
        success: true,
        lottery_id: "lottery-local",
        base_week_start: getIsoWeekMonday(),
      };
    }


    const res = data as { success: boolean; error?: string; lottery_id?: string; base_week_start?: string };
    return res;
  },

  /**
   * Obtiene las zonas del hogar
   */
  async getZones(householdId: string = DEFAULT_HOUSEHOLD_ID): Promise<CleaningZone[]> {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("cleaning_zones")
      .select("*")
      .eq("household_id", householdId)
      .order("rotation_order", { ascending: true });

    if (error) {
      console.error("[cleaningService] Error fetching zones:", error);
      return [];
    }

    return (data || []) as CleaningZone[];
  },

  /**
   * Obtiene las tareas checklist de una zona
   */
  async getTasksByZone(zoneId: string): Promise<CleaningTask[]> {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("cleaning_tasks")
      .select("*")
      .eq("zone_id", zoneId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("[cleaningService] Error fetching tasks:", error);
      return [];
    }

    return (data || []) as CleaningTask[];
  },

  /**
   * Obtiene las asignaciones completas de zonas para la semana dada,
   * incluyendo tareas, estado de completado, progreso y solicitudes de ayuda.
   */
  async getCurrentZoneAssignments(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    targetDateStr?: string
  ): Promise<ZoneAssignment[]> {
    const supabase = getClient();
    const weekStart = targetDateStr ? getIsoWeekMonday(new Date(targetDateStr)) : getIsoWeekMonday(new Date());

    // 1. Obtener asignaciones base mediante RPC determinista
    const { data: assignmentsData, error: assignmentsError } = await supabase.rpc(
      "rpc_get_current_zone_assignments",
      {
        p_household_id: householdId,
        p_target_date: targetDateStr || new Date().toISOString(),
      }
    );

    let rawAssignments: {
      zone_id: string;
      zone_name: string;
      zone_slug: CleaningZoneSlug;
      zone_icon: string;
      zone_default_points: number;
      zone_help_points: number;
      assigned_user_id: string | null;
      assigned_user_name: string;
      is_override: boolean;
      week_start: string;
    }[] = [];

    if (!assignmentsError && Array.isArray(assignmentsData) && assignmentsData.length > 0) {
      rawAssignments = assignmentsData as unknown as typeof rawAssignments;
    } else {
      rawAssignments = CLEANING_ZONES_CONFIG.map((z) => ({
        zone_id: `zone-${z.slug}`,
        zone_name: z.name,
        zone_slug: z.slug,
        zone_icon: z.icon,
        zone_default_points: z.defaultPoints,
        zone_help_points: z.helpPoints,
        assigned_user_id: null,
        assigned_user_name: "Sin asignar",
        is_override: false,
        week_start: weekStart,
      }));
    }

    // 2. Cargar todas las tareas
    const zoneIds = rawAssignments.map((a) => a.zone_id);
    const { data: allTasksData } = await supabase
      .from("cleaning_tasks")
      .select("*")
      .in("zone_id", zoneIds)
      .order("order_index", { ascending: true });

    let allTasks = (allTasksData || []) as CleaningTask[];
    if (allTasks.length === 0) {
      allTasks = CLEANING_ZONES_CONFIG.flatMap((z) =>
        z.tasks.map((title, idx) => ({
          id: `task-${z.slug}-${idx}`,
          zone_id: `zone-${z.slug}`,
          title,
          order_index: idx + 1,
          created_at: new Date().toISOString(),
        }))
      );
    }


    // 3. Cargar checks semanales
    const taskIds = allTasks.map((t) => t.id);
    const { data: checksData } = await supabase
      .from("cleaning_weekly_task_checks")
      .select("*")
      .in("task_id", taskIds.length > 0 ? taskIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("week_start", weekStart);

    const checkMap = new Map<string, { completed_by: string; completed_at: string }>();
    (checksData || []).forEach((c: { task_id: string; completed_by: string; completed_at: string }) => {
      checkMap.set(c.task_id, { completed_by: c.completed_by, completed_at: c.completed_at });
    });

    // 4. Cargar solicitudes de ayuda activas
    const { data: helpReqsData } = await supabase
      .from("cleaning_help_requests")
      .select("*, cleaning_helpers(*)")
      .in("zone_id", zoneIds)
      .eq("week_start", weekStart);

    const helpReqMap = new Map<string, CleaningHelpRequest>();
    (helpReqsData || []).forEach((hr: unknown) => {
      const h = hr as {
        id: string;
        household_id: string;
        zone_id: string;
        requester_id: string;
        week_start: string;
        status: "open" | "completed" | "cancelled";
        created_at: string;
        cleaning_helpers?: {
          id: string;
          help_request_id: string;
          helper_id: string;
          joined_at: string;
          points_awarded: number;
        }[];
      };
      helpReqMap.set(h.zone_id, {
        id: h.id,
        household_id: h.household_id,
        zone_id: h.zone_id,
        requester_id: h.requester_id,
        week_start: h.week_start,
        status: h.status,
        created_at: h.created_at,
        helpers: (h.cleaning_helpers || []).map((ch) => ({
          id: ch.id,
          help_request_id: ch.help_request_id,
          helper_id: ch.helper_id,
          joined_at: ch.joined_at,
          points_awarded: ch.points_awarded,
        })),
      });
    });

    // 5. Cargar completions de zona
    const { data: completionsData } = await supabase
      .from("cleaning_completions")
      .select("zone_id")
      .in("zone_id", zoneIds)
      .eq("week_start", weekStart);

    const completedZoneSet = new Set((completionsData || []).map((c: { zone_id: string }) => c.zone_id));

    // 6. Ensamblar ZoneAssignment[]
    return rawAssignments.map((ra) => {
      const tasksForZone = allTasks
        .filter((t) => t.zone_id === ra.zone_id)
        .map((t) => {
          const chk = checkMap.get(t.id);
          return {
            ...t,
            is_checked: !!chk,
            completed_by: chk?.completed_by,
            completed_at: chk?.completed_at,
          };
        });

      const checkedCount = tasksForZone.filter((t) => t.is_checked).length;
      const totalCount = tasksForZone.length;
      const isCompleted = completedZoneSet.has(ra.zone_id) || (totalCount > 0 && checkedCount === totalCount);
      const helpReq = helpReqMap.get(ra.zone_id) || null;

      return {
        zone_id: ra.zone_id,
        zone_name: ra.zone_name,
        zone_slug: ra.zone_slug,
        zone_icon: ra.zone_icon,
        zone_default_points: ra.zone_default_points,
        zone_help_points: ra.zone_help_points,
        assigned_user_id: ra.assigned_user_id,
        assigned_user_name: ra.assigned_user_name,
        is_override: ra.is_override,
        week_start: ra.week_start,
        tasks: tasksForZone,
        is_completed: isCompleted,
        checked_count: checkedCount,
        total_count: totalCount,
        help_request: helpReq,
        helpers: helpReq?.helpers || [],
      };
    });
  },

  /**
   * Marca o desmarca una tarea de limpieza con validación estricta de zona propia / ayudante
   */
  async toggleCleaningTask(
    taskId: string,
    userId: string,
    weekStart: string = getIsoWeekMonday()
  ): Promise<{
    success: boolean;
    error?: string;
    action?: "checked" | "unckecked";
    task_id?: string;
    is_completed?: boolean;
    checked_tasks?: number;
    total_tasks?: number;
  }> {
    const supabase = getClient();
    const { data, error } = await supabase.rpc("rpc_toggle_cleaning_task", {
      p_task_id: taskId,
      p_user_id: userId,
      p_week_start: weekStart,
    });

    if (error) {
      console.error("[cleaningService] Error toggling cleaning task:", error);
      return { success: false, error: error.message };
    }

    return data as {
      success: boolean;
      error?: string;
      action?: "checked" | "unckecked";
      task_id?: string;
      is_completed?: boolean;
      checked_tasks?: number;
      total_tasks?: number;
    };
  },

  /**
   * Solicita ayuda para la zona asignada al usuario
   */
  async requestHelp(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    zoneId: string,
    userId: string,
    weekStart: string = getIsoWeekMonday()
  ): Promise<{ success: boolean; error?: string; request_id?: string }> {
    const supabase = getClient();
    const { data, error } = await supabase.rpc("rpc_request_cleaning_help", {
      p_household_id: householdId,
      p_zone_id: zoneId,
      p_user_id: userId,
      p_week_start: weekStart,
    });

    if (error) {
      console.error("[cleaningService] Error requesting cleaning help:", error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string; request_id?: string };
  },

  /**
   * Acepta una solicitud de ayuda
   */
  async acceptHelp(
    helpRequestId: string,
    helperId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient();
    const { data, error } = await supabase.rpc("rpc_accept_cleaning_help", {
      p_help_request_id: helpRequestId,
      p_helper_id: helperId,
    });

    if (error) {
      console.error("[cleaningService] Error accepting cleaning help:", error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  },

  /**
   * Reasignación excepcional por el Administrador
   */
  async adminReassignZone(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    adminId: string,
    userId: string,
    zoneId: string,
    weekStart: string = getIsoWeekMonday(),
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient();
    const { data, error } = await supabase.rpc("rpc_admin_reassign_zone", {
      p_household_id: householdId,
      p_admin_id: adminId,
      p_user_id: userId,
      p_zone_id: zoneId,
      p_week_start: weekStart,
      p_reason: reason || "",
    });

    if (error) {
      console.error("[cleaningService] Error reassigning zone:", error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  },

  /**
   * Actualiza los puntos de una zona (solo Admin)
   */
  async adminUpdateZonePoints(
    zoneId: string,
    defaultPoints: number,
    helpPoints: number = 1
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient();
    const { error } = await supabase
      .from("cleaning_zones")
      .update({
        default_points: defaultPoints,
        help_points: helpPoints,
        updated_at: new Date().toISOString(),
      })
      .eq("id", zoneId);

    if (error) {
      console.error("[cleaningService] Error updating zone points:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Modifica el título de una tarea checklist (solo Admin)
   */
  async adminUpdateTask(taskId: string, title: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient();
    const { error } = await supabase
      .from("cleaning_tasks")
      .update({ title })
      .eq("id", taskId);

    if (error) {
      console.error("[cleaningService] Error updating task:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Añade una nueva tarea a una zona (solo Admin)
   */
  async adminAddTask(
    zoneId: string,
    title: string,
    orderIndex: number
  ): Promise<{ success: boolean; error?: string; task?: CleaningTask }> {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("cleaning_tasks")
      .insert({ zone_id: zoneId, title, order_index: orderIndex })
      .select()
      .single();

    if (error) {
      console.error("[cleaningService] Error adding task:", error);
      return { success: false, error: error.message };
    }

    return { success: true, task: data as CleaningTask };
  },

  /**
   * Elimina una tarea de una zona (solo Admin)
   */
  async adminDeleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient();
    const { error } = await supabase.from("cleaning_tasks").delete().eq("id", taskId);

    if (error) {
      console.error("[cleaningService] Error deleting task:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },
};
