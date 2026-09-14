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

    // 2. Suscribirse a Supabase Realtime Postgres Changes en la tabla 'notifications'
    const supabase = getSupabaseBrowserClient();
    const realtimeChannel = supabase
      .channel("pisopro-notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `household_id=eq.${DEFAULT_HOUSEHOLD_ID}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (!row || !row.id) return;

          const isActor = row.actor_user_id === currentUser?.id;
          const isTarget = !row.target_user_id || row.target_user_id === currentUser?.id;

          // Si el usuario actual es el destinatario o el emisor de la acción
          if (isTarget || isActor) {
            const notifItem: PisoProNotification = {
              id: row.id,
              household_id: row.household_id,
              type: row.type as NotificationType,
              title: isActor && !isTarget ? `[Enviado] ${row.title}` : row.title,
              body: row.body,
              created_at: row.created_at,
              read: isActor && !isTarget,
              target_user_id: row.target_user_id ?? null,
              actor_user_id: row.actor_user_id ?? null,
              data: (row.data as Record<string, unknown>) || undefined,
            };

            // Añadir al estado en memoria
            setNotifications((prev) => {
              if (prev.some((p) => p.id === notifItem.id)) return prev;
              return [notifItem, ...prev];
            });

            // Guardar en almacenamiento in-app local
            const currentList = notificationService.getInAppNotifications(DEFAULT_HOUSEHOLD_ID);
            if (!currentList.some((n) => n.id === notifItem.id)) {
              notificationService.saveInAppNotifications(
                [notifItem, ...currentList],
                DEFAULT_HOUSEHOLD_ID
              );
            }

            // Si es destinatario directo y no es el propio emisor: sonido + push nativo
            if (isTarget && !isActor) {
              notificationService.playNotificationSound();
              void notificationService.sendNotification(row.title, {
                body: row.body,
                data: row.data,
              });
            }
          }
        }
      )
      .on("broadcast", { event: "new-notification" }, (payload) => {
        const notif = payload.payload as PisoProNotification;
        if (!notif || !notif.id) return;

        const isSelf = notif.actor_user_id === currentUser?.id;
        const isTarget = !notif.target_user_id || notif.target_user_id === currentUser?.id;

        if (isTarget || isSelf) {
          setNotifications((prev) => {
            if (prev.some((p) => p.id === notif.id)) return prev;
            return [notif, ...prev];
          });
          if (!isSelf && isTarget) {
            notificationService.playNotificationSound();
            void notificationService.sendNotification(notif.title, {
              body: notif.body,
              data: notif.data,
            });
          }
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

          const formatted: PisoProNotification[] = rows
            .filter((row) => {
              if (!currentUser) return true;
              return (
                !row.target_user_id ||
                row.target_user_id === currentUser.id ||
                row.actor_user_id === currentUser.id
              );
            })
            .map((row) => ({
              id: row.id,
              household_id: row.household_id,
              type: row.type as NotificationType,
              title:
                row.actor_user_id === currentUser?.id && row.target_user_id !== currentUser?.id
                  ? `[Enviado] ${row.title}`
                  : row.title,
              body: row.body,
              created_at: row.created_at,
              read:
                row.actor_user_id === currentUser?.id && row.target_user_id !== currentUser?.id
                  ? true
                  : (row.read ?? false),
              target_user_id: row.target_user_id ?? null,
              actor_user_id: row.actor_user_id ?? null,
              data: (row.data as Record<string, unknown>) || undefined,
            }));

          setNotifications(formatted);
          notificationService.saveInAppNotifications(formatted, DEFAULT_HOUSEHOLD_ID);
        }
      } catch {
        // Fallback silencioso si la tabla no está disponible o sin conexión
      }
    };
    void fetchCloudNotifications();

    return () => {
      window.removeEventListener("pisopro-notification-updated", handleLocalUpdate);
      window.removeEventListener("storage", handleLocalUpdate);
      void supabase.removeChannel(realtimeChannel);
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
