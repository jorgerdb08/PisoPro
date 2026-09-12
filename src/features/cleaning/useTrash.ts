"use client";

import { useState, useEffect, useCallback } from "react";
import { trashService, type DateRangeFilter } from "@/services/trashService";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import type { TrashEvent, TrashUserStats } from "@/types";

export function useTrash() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<TrashEvent[]>([]);
  const [stats, setStats] = useState<TrashUserStats[]>([]);
  const [filter, setFilter] = useState<DateRangeFilter>("week");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const supabase = getSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    try {
      const [eventsData, statsData] = await Promise.all([
        trashService.getTrashEvents(DEFAULT_HOUSEHOLD_ID, filter),
        trashService.getTrashUserStats(DEFAULT_HOUSEHOLD_ID, filter),
      ]);
      setEvents(eventsData);
      setStats(statsData);
    } catch (err) {
      console.error("[useTrash] Error loading trash data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let isMounted = true;

    const runLoad = async () => {
      try {
        const [eventsData, statsData] = await Promise.all([
          trashService.getTrashEvents(DEFAULT_HOUSEHOLD_ID, filter),
          trashService.getTrashUserStats(DEFAULT_HOUSEHOLD_ID, filter),
        ]);
        if (isMounted) {
          setEvents(eventsData);
          setStats(statsData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[useTrash] Error in effect load:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    void runLoad();

    // Supabase Realtime para sincronizar al instante cuando alguien tira la basura
    const channel = supabase
      .channel("pisopro-trash-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trash_events" },
        () => void runLoad()
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [filter, supabase]);

  const recordTrash = useCallback(
    async (trashType: string = "general") => {
      if (!currentUser) return { success: false, error: "No hay usuario activo" };
      setIsSubmitting(true);
      try {
        const res = await trashService.recordTrash(
          DEFAULT_HOUSEHOLD_ID,
          currentUser.id,
          trashType
        );
        if (res.success) {
          await loadData();
        }
        return res;
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, loadData]
  );

  return {
    events,
    stats,
    filter,
    setFilter,
    isLoading,
    isSubmitting,
    recordTrash,
    refresh: loadData,
  };
}
