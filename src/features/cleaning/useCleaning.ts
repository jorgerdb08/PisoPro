"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cleaningService, getIsoWeekMonday } from "@/services/cleaningService";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import type { ZoneAssignment, CleaningLottery, CleaningHelpRequest } from "@/types";

export function useCleaning() {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState<ZoneAssignment[]>([]);
  const [lottery, setLottery] = useState<CleaningLottery | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    try {
      const [lotteryData, assignmentsData] = await Promise.all([
        cleaningService.getLottery(DEFAULT_HOUSEHOLD_ID),
        cleaningService.getCurrentZoneAssignments(DEFAULT_HOUSEHOLD_ID),
      ]);
      setLottery(lotteryData);
      setAssignments(assignmentsData);
    } catch (err) {
      console.error("[useCleaning] Error loading cleaning data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const runLoad = async () => {
      try {
        const [lotteryData, assignmentsData] = await Promise.all([
          cleaningService.getLottery(DEFAULT_HOUSEHOLD_ID),
          cleaningService.getCurrentZoneAssignments(DEFAULT_HOUSEHOLD_ID),
        ]);
        if (isMounted) {
          setLottery(lotteryData);
          setAssignments(assignmentsData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[useCleaning] Error in effect load:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    void runLoad();

    // Supabase Realtime para sincronizar todos los cambios al instante
    const channel = supabase
      .channel("pisopro-cleaning-rules-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_lottery" },
        () => void runLoad()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_weekly_task_checks" },
        () => void runLoad()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_help_requests" },
        () => void runLoad()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_helpers" },
        () => void runLoad()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_completions" },
        () => void runLoad()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_zones" },
        () => void runLoad()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_tasks" },
        () => void runLoad()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cleaning_assignment_overrides" },
        () => void runLoad()
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Zona asignada actualmente al usuario logueado
  const myAssignedZone = useMemo(() => {
    if (!currentUser) return undefined;
    return assignments.find((a) => a.assigned_user_id === currentUser.id);
  }, [assignments, currentUser]);

  // Solicitudes de ayuda activas de otros compañeros
  const activeHelpRequests = useMemo(() => {
    const list: CleaningHelpRequest[] = [];
    assignments.forEach((a) => {
      if (
        a.help_request &&
        a.help_request.status === "open" &&
        a.help_request.requester_id !== currentUser?.id
      ) {
        list.push({
          ...a.help_request,
          zone_name: a.zone_name,
          zone_icon: a.zone_icon,
        });
      }
    });
    return list;
  }, [assignments, currentUser]);

  // Comprobar si el usuario actual ya está ayudando en una solicitud
  const isUserHelpingInZone = useCallback(
    (zoneId: string) => {
      if (!currentUser) return false;
      const zone = assignments.find((a) => a.zone_id === zoneId);
      if (!zone || !zone.helpers) return false;
      return zone.helpers.some((h) => h.helper_id === currentUser.id);
    },
    [assignments, currentUser]
  );

  // Ejecutar sorteo (Admin)
  const executeLottery = useCallback(async () => {
    if (!currentUser) return { success: false, error: "No hay usuario activo" };
    if (currentUser.role !== "admin") {
      return { success: false, error: "Solo Jorge (admin) puede realizar el sorteo." };
    }

    setActionError(null);
    const res = await cleaningService.executeLottery(DEFAULT_HOUSEHOLD_ID, currentUser.id);
    if (!res.success) {
      setActionError(res.error || "Error al realizar el sorteo");
      return res;
    }

    await loadData();
    return res;
  }, [currentUser, loadData]);

  // Marcar / Desmarcar tarea de limpieza
  const toggleTask = useCallback(
    async (taskId: string, zoneId: string) => {
      if (!currentUser) return { success: false, error: "No hay usuario activo" };

      const zone = assignments.find((a) => a.zone_id === zoneId);
      if (!zone) return { success: false, error: "Zona no encontrada" };

      // Regla de negocio en cliente también:
      const isOwner = zone.assigned_user_id === currentUser.id;
      const isHelper = zone.helpers.some((h) => h.helper_id === currentUser.id);

      if (!isOwner && !isHelper) {
        const errorMsg = "🔒 Esta no es tu zona esta semana. Solo puedes limpiar tu zona asignada o actuar como ayudante aceptado.";
        setActionError(errorMsg);
        return { success: false, error: errorMsg };
      }

      setActionError(null);
      const res = await cleaningService.toggleCleaningTask(
        taskId,
        currentUser.id,
        getIsoWeekMonday()
      );

      if (!res.success) {
        setActionError(res.error || "No se pudo actualizar la tarea");
        return res;
      }

      await loadData();
      return res;
    },
    [currentUser, assignments, loadData]
  );

  // Pedir ayuda
  const requestHelp = useCallback(
    async (zoneId: string) => {
      if (!currentUser) return { success: false, error: "No hay usuario activo" };
      setActionError(null);

      const res = await cleaningService.requestHelp(
        DEFAULT_HOUSEHOLD_ID,
        zoneId,
        currentUser.id,
        getIsoWeekMonday()
      );

      if (!res.success) {
        setActionError(res.error || "Error al solicitar ayuda");
        return res;
      }

      await loadData();
      return res;
    },
    [currentUser, loadData]
  );

  // Aceptar ayudar a un compañero
  const acceptHelp = useCallback(
    async (helpRequestId: string) => {
      if (!currentUser) return { success: false, error: "No hay usuario activo" };
      setActionError(null);

      const res = await cleaningService.acceptHelp(helpRequestId, currentUser.id);
      if (!res.success) {
        setActionError(res.error || "Error al aceptar la ayuda");
        return res;
      }

      await loadData();
      return res;
    },
    [currentUser, loadData]
  );

  return {
    assignments,
    lottery,
    isLotteryExecuted: !!lottery?.is_locked,
    myAssignedZone,
    activeHelpRequests,
    isUserHelpingInZone,
    isLoading,
    actionError,
    clearActionError: () => setActionError(null),
    executeLottery,
    toggleTask,
    requestHelp,
    acceptHelp,
    refresh: loadData,
  };
}
