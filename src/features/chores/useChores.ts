"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { choresService } from "@/services/choresService";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import type { Task } from "@/types";

export function useChores() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  const fetchTasks = useCallback(async () => {
    try {
      const data = await choresService.getTasks(DEFAULT_HOUSEHOLD_ID);
      setTasks(data);
    } catch (err) {
      console.error("[useChores] Error fetching tasks:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and Supabase Realtime subscription
  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      try {
        const data = await choresService.getTasks(DEFAULT_HOUSEHOLD_ID);
        if (isMounted) {
          setTasks(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[useChores] Error loading tasks in effect:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTasks();

    const channel = supabase
      .channel("pisopro-chores-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          void loadTasks();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Derived collections
  const myTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter((t) => t.assigned_user_id === currentUser.id);
  }, [tasks, currentUser]);

  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "pending");
  }, [tasks]);

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "completed");
  }, [tasks]);

  const myPendingTasks = useMemo(() => {
    return myTasks.filter((t) => t.status === "pending");
  }, [myTasks]);

  // Toggle completion with optimistic update
  const toggleTask = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const newStatus = task.status === "completed" ? "pending" : "completed";
      setActionLoading(taskId);

      // Optimistic local update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      try {
        await choresService.toggleTaskStatus(
          taskId,
          newStatus,
          currentUser?.id,
          task.points
        );
      } catch (err) {
        console.error("[useChores] Error toggling task:", err);
        // Rollback on failure
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
        );
      } finally {
        setActionLoading(null);
      }
    },
    [tasks, currentUser]
  );

  // Rotate chores between flatmates
  const rotateAllChores = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await choresService.rotateChores(DEFAULT_HOUSEHOLD_ID);
      await fetchTasks();
      return res;
    } catch (err) {
      console.error("[useChores] Error rotating chores:", err);
      return { success: false, rotatedCount: 0 };
    } finally {
      setIsLoading(false);
    }
  }, [fetchTasks]);

  // Reassign task
  const assignTask = useCallback(
    async (taskId: string, userId: string) => {
      setActionLoading(taskId);
      try {
        const ok = await choresService.reassignTask(taskId, userId);
        if (ok) {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, assigned_user_id: userId } : t))
          );
        }
        return ok;
      } finally {
        setActionLoading(null);
      }
    },
    []
  );

  // Create new task
  const createNewTask = useCallback(
    async (taskData: Omit<Task, "id" | "created_at" | "updated_at">) => {
      setIsLoading(true);
      try {
        const created = await choresService.createTask(taskData);
        if (created) {
          await fetchTasks();
        }
        return created;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchTasks]
  );

  // Delete task
  const removeTask = useCallback(
    async (taskId: string) => {
      setActionLoading(taskId);
      try {
        const ok = await choresService.deleteTask(taskId);
        if (ok) {
          setTasks((prev) => prev.filter((t) => t.id !== taskId));
        }
        return ok;
      } finally {
        setActionLoading(null);
      }
    },
    []
  );

  return {
    tasks,
    isLoading,
    actionLoading,
    myTasks,
    myPendingTasks,
    pendingTasks,
    completedTasks,
    toggleTask,
    rotateAllChores,
    assignTask,
    createNewTask,
    removeTask,
    refreshTasks: fetchTasks,
  };
}
