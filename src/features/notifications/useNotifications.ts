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
