"use client";

import React from "react";
import { WifiOff, CheckCircle2 } from "lucide-react";
import { useNetworkStatus } from "@/features/offline/useNetworkStatus";

export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (!isOnline) {
    return (
      <aside
        data-testid="offline-banner"
        role="alert"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 mx-auto max-w-md bg-amber-600 px-4 py-2 text-white shadow-lg animate-in slide-in-from-top duration-200"
      >
        <div className="flex items-center justify-between gap-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
            <span>Modo sin conexión · Los cambios se guardan localmente</span>
          </div>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            Offline
          </span>
        </div>
      </aside>
    );
  }

  if (wasOffline) {
    return (
      <aside
        data-testid="online-restored-banner"
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 mx-auto max-w-md bg-[#094152] px-4 py-2 text-white shadow-lg animate-in slide-in-from-top duration-200"
      >
        <div className="flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Conexión restablecida · Datos sincronizados con el piso</span>
        </div>
      </aside>
    );
  }

  return null;
}
