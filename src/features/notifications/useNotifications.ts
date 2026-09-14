"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { notificationService } from "./notificationService";
import { useAuth } from "@/features/auth/AuthContext";
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PisoProNotification, NotificationType } from "@/types";

export function useNotifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<PisoProNotification[]>(() => {
    return notificationService.getInAppNotifications(
      DEFAULT_HOUSEHOLD_ID,
      currentUser?.id
    );
  });
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    return notificationService.isEnabled();
  });
  const [isSupported] = useState<boolean>(() => {
    return notificationService.isSupported();
  });

  const loadLocalNotifications = useCallback(() => {
    const list = notificationService.getInAppNotifications(
      DEFAULT_HOUSEHOLD_ID,
      currentUser?.id
    );
    setNotifications(list);
  }, [currentUser?.id]);

  useEffect(() => {
    // 1. Escuchar eventos locales (ej. cambios en otras pestañas o ventanas)
    const handleLocalUpdate = () => {
      loadLocalNotifications();
    };
    window.addEventListener("pisopro-notification-updated", handleLocalUpdate);
    window.addEventListener("storage", handleLocalUpdate);

    // 2. Suscribirse a Supabase Realtime Broadcast para recibir avisos de otros compañeros
    const supabase = getSupabaseBrowserClient();
    const channelName = `pisopro-broadcast-${DEFAULT_HOUSEHOLD_ID}`;
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: "new-notification" }, (payload) => {
        const notif = payload.payload as PisoProNotification;
        if (!notif || !notif.id) return;

        // Si la notificación fue emitida por otro usuario y aplica a este usuario
        const isSelf = notif.actor_user_id === currentUser?.id;
        const isTarget = !notif.target_user_id || notif.target_user_id === currentUser?.id;

        if (!isSelf && isTarget) {
          // Guardar en almacenamiento in-app local
          const currentList = notificationService.getInAppNotifications(DEFAULT_HOUSEHOLD_ID);
          if (!currentList.some((n) => n.id === notif.id)) {
            notificationService.saveInAppNotifications([notif, ...currentList], DEFAULT_HOUSEHOLD_ID);
          }

          // Disparar notificación nativa en segundo plano
          void notificationService.sendNotification(notif.title, {
            body: notif.body,
            data: notif.data,
          });
        }
      })
      .subscribe();

    // 3. Sincronizar notificaciones persistidas en la nube desde Supabase
    const fetchCloudNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("household_id", DEFAULT_HOUSEHOLD_ID)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!error && data && data.length > 0) {
          const rows = data as unknown as Array<{
            id: string;
            household_id: string;
            type: string;
            title: string;
            body: string;
            created_at: string;
            read?: boolean;
            target_user_id?: string | null;
            actor_user_id?: string | null;
            data?: Record<string, unknown> | null;
          }>;
          const formatted: PisoProNotification[] = rows.map((row) => ({
            id: row.id,
            household_id: row.household_id,
            type: row.type as NotificationType,
            title: row.title,
            body: row.body,
            created_at: row.created_at,
            read: row.read ?? false,
            target_user_id: row.target_user_id ?? null,
            actor_user_id: row.actor_user_id ?? null,
            data: row.data as Record<string, unknown> | undefined,
          }));

          const localList = notificationService.getInAppNotifications(DEFAULT_HOUSEHOLD_ID);
          const combined = [...localList];
          for (const item of formatted) {
            if (
              !combined.some(
                (c) =>
                  c.id === item.id ||
                  (c.title === item.title &&
                    Math.abs(new Date(c.created_at).getTime() - new Date(item.created_at).getTime()) < 5000)
              )
            ) {
              combined.push(item);
            }
          }
          combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          notificationService.saveInAppNotifications(combined, DEFAULT_HOUSEHOLD_ID);
          setNotifications(
            combined.filter(
              (n) => !n.target_user_id || n.target_user_id === currentUser?.id
            )
          );
        }
      } catch {
        // Fallback silencioso si la tabla no está disponible o sin conexión
      }
    };
    void fetchCloudNotifications();

    return () => {
      window.removeEventListener("pisopro-notification-updated", handleLocalUpdate);
      window.removeEventListener("storage", handleLocalUpdate);
      void supabase.removeChannel(channel);
    };
  }, [currentUser?.id, loadLocalNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markAsRead = useCallback((notificationId: string) => {
    notificationService.markAsRead(notificationId, DEFAULT_HOUSEHOLD_ID);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead(DEFAULT_HOUSEHOLD_ID);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    notificationService.deleteNotification(notificationId, DEFAULT_HOUSEHOLD_ID);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const clearAll = useCallback(() => {
    notificationService.clearAllNotifications(DEFAULT_HOUSEHOLD_ID);
    setNotifications([]);
  }, []);

  const toggleNativePermission = useCallback(async () => {
    if (!isSupported) return false;

    if (isEnabled) {
      notificationService.disable();
      setIsEnabled(false);
      return false;
    } else {
      const granted = await notificationService.requestPermission();
      setIsEnabled(granted);
      if (granted) {
        void notificationService.sendNotification("🔔 Notificaciones activadas", {
          body: "Recibirás avisos de compras urgentes, ranking del piso y tareas semanales.",
        });
      }
      return granted;
    }
  }, [isEnabled, isSupported]);

  const dispatchNotification = useCallback(
    async (params: {
      type: NotificationType;
      title: string;
      body: string;
      targetUserId?: string | null;
      data?: Record<string, unknown>;
    }) => {
      const notif = await notificationService.dispatchNotification({
        ...params,
        householdId: DEFAULT_HOUSEHOLD_ID,
        actorUserId: currentUser?.id,
        actorName: currentUser?.name,
      });
      loadLocalNotifications();
      return notif;
    },
    [currentUser?.id, currentUser?.name, loadLocalNotifications]
  );

  return {
    notifications,
    unreadCount,
    isEnabled,
    isSupported,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    toggleNativePermission,
    dispatchNotification,
    reload: loadLocalNotifications,
  };
}
