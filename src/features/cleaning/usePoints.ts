"use client";

import { useState, useEffect, useCallback } from "react";
import { pointsService } from "@/services/pointsService";
import type { DateRangeFilter } from "@/services/trashService";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import type { PointTransaction, UserContributionStats } from "@/types";

export function usePoints() {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [stats, setStats] = useState<UserContributionStats[]>([]);
  const [filter, setFilter] = useState<DateRangeFilter>("week");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const supabase = getSupabaseBrowserClient();

  const loadData = useCallback(async () => {
    try {
      const [txData, statsData] = await Promise.all([
        pointsService.getPointTransactions(DEFAULT_HOUSEHOLD_ID, filter),
        pointsService.getContributionStats(DEFAULT_HOUSEHOLD_ID, filter),
      ]);
      setTransactions(txData);
      setStats(statsData);
    } catch (err) {
      console.error("[usePoints] Error loading points data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let isMounted = true;

    const runLoad = async () => {
      try {
        const [txData, statsData] = await Promise.all([
          pointsService.getPointTransactions(DEFAULT_HOUSEHOLD_ID, filter),
          pointsService.getContributionStats(DEFAULT_HOUSEHOLD_ID, filter),
        ]);
        if (isMounted) {
          setTransactions(txData);
          setStats(statsData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[usePoints] Error in effect load:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    void runLoad();

    // Supabase Realtime para actualizar puntos al instante
    const channel = supabase
      .channel("pisopro-points-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "point_transactions" },
        () => void runLoad()
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [filter, supabase]);

  return {
    transactions,
    stats,
    filter,
    setFilter,
    isLoading,
    refresh: loadData,
  };
}
