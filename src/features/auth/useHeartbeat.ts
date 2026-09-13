"use client";

import { useEffect, useRef, useCallback } from "react";
import { authService } from "@/services/authService";
import { getDeviceFriendlyName } from "@/features/auth/device";

const HEARTBEAT_INTERVAL_MS = 25000; // 25s

interface UseHeartbeatProps {
  sessionToken: string | null;
  isActive: boolean;
  onSessionExpired: (reason?: string) => void;
}

export function useHeartbeat({
  sessionToken,
  isActive,
  onSessionExpired,
}: UseHeartbeatProps) {
  const expiredCallbackRef = useRef(onSessionExpired);

  useEffect(() => {
    expiredCallbackRef.current = onSessionExpired;
  }, [onSessionExpired]);

  const triggerHeartbeat = useCallback(async () => {
    if (!sessionToken || !isActive) return;

    try {
      const deviceName = getDeviceFriendlyName();
      const result = await authService.sendHeartbeat(sessionToken, deviceName);

      if (!result.success) {
        console.warn("[useHeartbeat] Heartbeat rejected by database:", result.error);
        const reason = result.is_revoked
          ? "REVOKED"
          : result.is_expired
          ? "EXPIRED"
          : result.error || "REJECTED";
        expiredCallbackRef.current(reason);
      }
    } catch (err) {
      console.error("[useHeartbeat] Network error during heartbeat:", err);
    }
  }, [sessionToken, isActive]);

  useEffect(() => {
    if (!sessionToken || !isActive) return;

    // Periodic heartbeat timer
    const interval = setInterval(() => {
      void triggerHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    // Immediate heartbeat when app becomes visible / focused
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void triggerHeartbeat();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [sessionToken, isActive, triggerHeartbeat]);
}
