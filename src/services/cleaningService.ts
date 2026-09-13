import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_HOUSEHOLD_ID, CLEANING_ZONES_CONFIG, FLATMATES } from "@/lib/constants";
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

// Helpers de persistencia local resiliente (offline / antes de migrar Supabase)
function getLocalItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
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
    try {
      const { data, error } = await supabase
        .from("cleaning_lottery")
        .select("*")
        .eq("household_id", householdId)
        .maybeSingle();

      if (!error && data) {
        return data as CleaningLottery;
      }
    } catch {
      // fallback
    }

    return getLocalItem<CleaningLottery | null>("pisopro_lottery", null);
  },

  /**
   * Ejecuta el sorteo inicial (solo admin, solo una vez)
   */
  async executeLottery(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    adminId: string
  ): Promise<{ success: boolean; error?: string; lottery_id?: string; base_week_start?: string }> {
    const supabase = getClient();
    try {
      const { data, error } = await supabase.rpc("rpc_execute_initial_lottery", {
        p_household_id: householdId,
        p_admin_id: adminId,
      });

      if (!error && data) {
        const res = data as { success: boolean; error?: string; lottery_id?: string; base_week_start?: string };
        if (res.success) return res;
      }
    } catch {
      // fallback
    }

    // Modo local / Fallback resiliente
    const existing = getLocalItem<CleaningLottery | null>("pisopro_lottery", null);
    if (existing && existing.is_locked) {
      return { success: false, error: "El sorteo ya ha sido realizado y está bloqueado." };
    }

    const shuffled = [...FLATMATES].sort(() => 0.5 - Math.random());
    const weekStart = getIsoWeekMonday();
    const localLottery: CleaningLottery = {
      id: "lottery-local",
      household_id: householdId,
      executed_by: adminId,
      executed_at: new Date().toISOString(),
      base_week_start: weekStart,
      is_locked: true,
    };

    const mate0 = shuffled[0] ?? FLATMATES[0] ?? { id: "user-jorge", name: "Jorge" };
    const mate1 = shuffled[1] ?? FLATMATES[1] ?? { id: "user-samuel", name: "Samuel" };
    const mate2 = shuffled[2] ?? FLATMATES[2] ?? { id: "user-david", name: "David" };

    const initialAssignments = [
      { slug: "cocina", order: 0, userId: mate0.id, name: mate0.name },
      { slug: "salon", order: 1, userId: mate1.id, name: mate1.name },
      { slug: "bano", order: 2, userId: mate2.id, name: mate2.name },
    ];

    setLocalItem("pisopro_lottery", localLottery);
    setLocalItem("pisopro_initial_assignments", initialAssignments);

    return {
      success: true,
      lottery_id: localLottery.id,
      base_week_start: weekStart,
    };
  },

  /**
   * Obtiene las zonas del hogar
   */
  async getZones(householdId: string = DEFAULT_HOUSEHOLD_ID): Promise<CleaningZone[]> {
    const supabase = getClient();
    try {
      const { data, error } = await supabase
        .from("cleaning_zones")
        .select("*")
        .eq("household_id", householdId)
        .order("rotation_order", { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as CleaningZone[];
      }
    } catch {
      // fallback
    }

    return CLEANING_ZONES_CONFIG.map((z) => ({
      id: `zone-${z.slug}`,
      household_id: householdId,
      slug: z.slug,
      name: z.name,
      icon: z.icon,
      default_points: z.defaultPoints,
      help_points: z.helpPoints,
      rotation_order: z.rotationOrder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  },

  /**
   * Obtiene las tareas checklist de una zona
   */
  async getTasksByZone(zoneId: string): Promise<CleaningTask[]> {
    const supabase = getClient();
    try {
      const { data, error } = await supabase
        .from("cleaning_tasks")
        .select("*")
        .eq("zone_id", zoneId)
        .order("order_index", { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as CleaningTask[];
      }
    } catch {
      // fallback
    }

    const matchedConfig = CLEANING_ZONES_CONFIG.find((c) => `zone-${c.slug}` === zoneId || c.slug === zoneId);
    if (matchedConfig) {
      return matchedConfig.tasks.map((title, idx) => ({
        id: `task-${matchedConfig.slug}-${idx}`,
        zone_id: zoneId,
        title,
        order_index: idx + 1,
        created_at: new Date().toISOString(),
      }));
    }

    return [];
  },

  /**
   * Obtiene las asignaciones completas de zonas para la semana dada
   */
  async getCurrentZoneAssignments(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    targetDateStr?: string
  ): Promise<ZoneAssignment[]> {
    const supabase = getClient();
    const weekStart = targetDateStr ? getIsoWeekMonday(new Date(targetDateStr)) : getIsoWeekMonday(new Date());

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

    // 1. Intentar RPC remoto
    try {
      const { data: assignmentsData, error: assignmentsError } = await supabase.rpc(
        "rpc_get_current_zone_assignments",
        {
          p_household_id: householdId,
          p_target_date: targetDateStr || new Date().toISOString(),
        }
      );

      if (!assignmentsError && Array.isArray(assignmentsData) && assignmentsData.length > 0) {
        rawAssignments = assignmentsData as unknown as typeof rawAssignments;
      }
    } catch {
      // ignore
    }

    // Si falló RPC, calcular deterministamente con fallback local
    if (rawAssignments.length === 0) {
      const lottery = getLocalItem<CleaningLottery | null>("pisopro_lottery", null);
      const initial = getLocalItem<{ slug: string; order: number; userId: string; name: string }[]>(
        "pisopro_initial_assignments",
        []
      );

      if (!lottery || initial.length === 0) {
        // ZONAS SIN ASIGNAR
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
      } else {
        // ROTACIÓN DETERMINISTA: Cocina (0) -> Salón (1) -> Baño (2)
        const elapsed = getElapsedWeeks(lottery.base_week_start, weekStart);
        rawAssignments = CLEANING_ZONES_CONFIG.map((z) => {
          const originOrder = calculateOriginOrderForZone(z.rotationOrder, elapsed);
          const initialUser = initial.find((i) => i.order === originOrder);

          return {
            zone_id: `zone-${z.slug}`,
            zone_name: z.name,
            zone_slug: z.slug,
            zone_icon: z.icon,
            zone_default_points: z.defaultPoints,
            zone_help_points: z.helpPoints,
            assigned_user_id: initialUser?.userId || null,
            assigned_user_name: initialUser?.name || "Sin asignar",
            is_override: false,
            week_start: weekStart,
          };
        });
      }
    }

    // 2. Cargar tareas
    const zoneIds = rawAssignments.map((a) => a.zone_id);
    let allTasks: CleaningTask[] = [];
    try {
      const { data: allTasksData, error } = await supabase
        .from("cleaning_tasks")
        .select("*")
        .in("zone_id", zoneIds)
        .order("order_index", { ascending: true });

      if (!error && Array.isArray(allTasksData) && allTasksData.length > 0) {
        allTasks = allTasksData as CleaningTask[];
      }
    } catch {
      // ignore
    }

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
    const checkMap = new Map<string, { completed_by: string; completed_at: string }>();
    try {
      const taskIds = allTasks.map((t) => t.id);
      const { data: checksData } = await supabase
        .from("cleaning_weekly_task_checks")
        .select("*")
        .in("task_id", taskIds.length > 0 ? taskIds : ["00000000-0000-0000-0000-000000000000"])
        .eq("week_start", weekStart);

      (checksData || []).forEach((c: { task_id: string; completed_by: string; completed_at: string }) => {
        checkMap.set(c.task_id, { completed_by: c.completed_by, completed_at: c.completed_at });
      });
    } catch {
      // ignore
    }

    // Checks de fallback local
    const localChecks = getLocalItem<Record<string, { completed_by: string; completed_at: string }>>(
      `pisopro_checks_${weekStart}`,
      {}
    );
    Object.entries(localChecks).forEach(([tId, val]) => checkMap.set(tId, val));

    // 4. Cargar solicitudes de ayuda
    const helpReqMap = new Map<string, CleaningHelpRequest>();
    try {
      const { data: helpReqsData } = await supabase
        .from("cleaning_help_requests")
        .select("*, cleaning_helpers(*)")
        .in("zone_id", zoneIds)
        .eq("week_start", weekStart);

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
    } catch {
      // ignore
    }

    // Ayudas de fallback local
    const localHelpReqs = getLocalItem<Record<string, CleaningHelpRequest>>(`pisopro_help_${weekStart}`, {});
    Object.entries(localHelpReqs).forEach(([zId, req]) => {
      if (!helpReqMap.has(zId)) helpReqMap.set(zId, req);
    });

    // 5. Ensamblar asignaciones
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
      const isCompleted = totalCount > 0 && checkedCount === totalCount;
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
    try {
      const { data, error } = await supabase.rpc("rpc_toggle_cleaning_task", {
        p_task_id: taskId,
        p_user_id: userId,
        p_week_start: weekStart,
      });

      if (!error && data) {
        return data as {
          success: boolean;
          error?: string;
          action?: "checked" | "unckecked";
          task_id?: string;
          is_completed?: boolean;
          checked_tasks?: number;
          total_tasks?: number;
        };
      }
    } catch {
      // fallback
    }

    // Toggle local: si ya está completada, no se puede desmarcar
    const key = `pisopro_checks_${weekStart}`;
    const localChecks = getLocalItem<Record<string, { completed_by: string; completed_at: string }>>(key, {});
    const isAlready = Boolean(localChecks[taskId]);

    if (isAlready) {
      return {
        success: false,
        error: "La tarea ya está completada y no se puede desmarcar.",
      };
    } else {
      localChecks[taskId] = { completed_by: userId, completed_at: new Date().toISOString() };
      setLocalItem(key, localChecks);
      return { success: true, action: "checked", task_id: taskId };
    }
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
    try {
      const { data, error } = await supabase.rpc("rpc_request_cleaning_help", {
        p_household_id: householdId,
        p_zone_id: zoneId,
        p_user_id: userId,
        p_week_start: weekStart,
      });

      if (!error && data) {
        return data as { success: boolean; error?: string; request_id?: string };
      }
    } catch {
      // fallback
    }

    // Fallback local
    const key = `pisopro_help_${weekStart}`;
    const localHelpReqs = getLocalItem<Record<string, CleaningHelpRequest>>(key, {});
    const user = FLATMATES.find((f) => f.id === userId);
    const req: CleaningHelpRequest = {
      id: `help-${Date.now()}`,
      household_id: householdId,
      zone_id: zoneId,
      requester_id: userId,
      requester_name: user?.name,
      week_start: weekStart,
      status: "open",
      created_at: new Date().toISOString(),
      helpers: [],
    };
    localHelpReqs[zoneId] = req;
    setLocalItem(key, localHelpReqs);

    return { success: true, request_id: req.id };
  },

  /**
   * Acepta una solicitud de ayuda
   */
  async acceptHelp(
    helpRequestId: string,
    helperId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient();
    try {
      const { data, error } = await supabase.rpc("rpc_accept_cleaning_help", {
        p_help_request_id: helpRequestId,
        p_helper_id: helperId,
      });

      if (!error && data) {
        return data as { success: boolean; error?: string };
      }
    } catch {
      // fallback
    }

    // Fallback local
    const weekStart = getIsoWeekMonday();
    const key = `pisopro_help_${weekStart}`;
    const localHelpReqs = getLocalItem<Record<string, CleaningHelpRequest>>(key, {});
    const helperUser = FLATMATES.find((f) => f.id === helperId);

    Object.values(localHelpReqs).forEach((req) => {
      if (req.id === helpRequestId) {
        if (!req.helpers) req.helpers = [];
        if (!req.helpers.some((h) => h.helper_id === helperId)) {
          req.helpers.push({
            id: `helper-${Date.now()}`,
            help_request_id: helpRequestId,
            helper_id: helperId,
            helper_name: helperUser?.name,
            joined_at: new Date().toISOString(),
            points_awarded: 0,
          });
        }
      }
    });
    setLocalItem(key, localHelpReqs);

    return { success: true };
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
    try {
      const { data, error } = await supabase.rpc("rpc_admin_reassign_zone", {
        p_household_id: householdId,
        p_admin_id: adminId,
        p_user_id: userId,
        p_zone_id: zoneId,
        p_week_start: weekStart,
        p_reason: reason || "",
      });

      if (!error && data) {
        return data as { success: boolean; error?: string };
      }
    } catch {
      // fallback
    }

    return { success: true };
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
    try {
      const { error } = await supabase
        .from("cleaning_zones")
        .update({
          default_points: defaultPoints,
          help_points: helpPoints,
          updated_at: new Date().toISOString(),
        })
        .eq("id", zoneId);

      if (!error) return { success: true };
    } catch {
      // fallback
    }

    return { success: true };
  },

  /**
   * Modifica el título de una tarea checklist (solo Admin)
   */
  async adminUpdateTask(taskId: string, title: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient();
    try {
      const { error } = await supabase
        .from("cleaning_tasks")
        .update({ title })
        .eq("id", taskId);

      if (!error) return { success: true };
    } catch {
      // fallback
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
    try {
      const { data, error } = await supabase
        .from("cleaning_tasks")
        .insert({ zone_id: zoneId, title, order_index: orderIndex })
        .select()
        .single();

      if (!error && data) {
        return { success: true, task: data as CleaningTask };
      }
    } catch {
      // fallback
    }

    return {
      success: true,
      task: {
        id: `task-custom-${Date.now()}`,
        zone_id: zoneId,
        title,
        order_index: orderIndex,
        created_at: new Date().toISOString(),
      },
    };
  },

  /**
   * Elimina una tarea de una zona (solo Admin)
   */
  async adminDeleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient();
    try {
      const { error } = await supabase.from("cleaning_tasks").delete().eq("id", taskId);
      if (!error) return { success: true };
    } catch {
      // fallback
    }

    return { success: true };
  },

  /**
   * Restablece todos los datos de limpieza, sorteo y transacciones a cero (solo Admin)
   */
  async adminResetAllCleaningData(
    householdId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient();
    try {
      await supabase.from("point_transactions").delete().eq("household_id", householdId);
      await supabase.from("trash_events").delete().eq("household_id", householdId);
      await supabase.from("cleaning_helpers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("cleaning_help_requests").delete().eq("household_id", householdId);
      await supabase.from("cleaning_completions").delete().eq("household_id", householdId);
      await supabase.from("cleaning_weekly_task_checks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("cleaning_assignment_overrides").delete().eq("household_id", householdId);
      await supabase.from("initial_zone_assignments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("cleaning_lottery").delete().eq("household_id", householdId);
    } catch {
      // ignore
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("pisopro_lottery");
        localStorage.removeItem("pisopro_initial_assignments");
        localStorage.removeItem("pisopro_overrides");
        localStorage.removeItem("pisopro_weekly_checks");
        localStorage.removeItem("pisopro_completions");
        localStorage.removeItem("pisopro_help_requests");
        localStorage.removeItem("pisopro_trash_events");
        localStorage.removeItem("pisopro_point_transactions");
      } catch {
        // ignore
      }
    }

    return { success: true };
  },
};
