"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellRing } from "lucide-react";
import { notificationService } from "../notificationService";
import { cn } from "@/lib/utils";

export function NotificationToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    void (async () => {
      setIsSupported(notificationService.isSupported());
      setIsEnabled(notificationService.isEnabled());
    })();
  }, []);

  const handleToggle = async () => {
    if (!isSupported) return;

    if (isEnabled) {
      notificationService.disable();
      setIsEnabled(false);
    } else {
      const granted = await notificationService.requestPermission();
      if (granted) {
        setIsEnabled(true);
        void notificationService.sendNotification("🔔 Notificaciones activadas", {
          body: "Recibirás avisos de tareas, gastos y menciones de tus compañeros.",
        });
      } else {
        setIsEnabled(false);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <button
      type="button"
      data-testid="notification-toggle-btn"
      onClick={handleToggle}
      title={
        isEnabled
          ? "Notificaciones activadas (Pulsa para desactivar)"
          : "Activar notificaciones del piso"
      }
      aria-label={
        isEnabled ? "Desactivar notificaciones" : "Activar notificaciones"
      }
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg border transition-all active:scale-95",
        isEnabled
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
          : "border-border/80 bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {isEnabled ? (
        <BellRing className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
    </button>
  );
}
