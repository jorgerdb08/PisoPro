"use client";

import { useState, useEffect, useCallback } from "react";
import { flatService, FlatmateScore } from "@/services/flatService";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { FLAT_INFO, FLAT_RULES, EMERGENCY_CONTACTS } from "@/lib/constants";

export function useFlat() {
  const [leaderboard, setLeaderboard] = useState<FlatmateScore[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const supabase = getSupabaseBrowserClient();

  const fetchScores = useCallback(async () => {
    try {
      const scores = await flatService.getLeaderboard();
      setLeaderboard(scores);
    } catch (err) {
      console.error("[useFlat] Error fetching leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const scores = await flatService.getLeaderboard();
        if (isMounted) {
          setLeaderboard(scores);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[useFlat] Error loading in effect:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    // Sincronización en tiempo real ante tareas completadas
    const channel = supabase
      .channel("pisopro-flat-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_completions" },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  return {
    flatInfo: FLAT_INFO,
    rules: FLAT_RULES,
    contacts: EMERGENCY_CONTACTS,
    leaderboard,
    isLoading,
    refresh: fetchScores,
  };
}
