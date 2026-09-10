"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Aviso de conexión"
      className="bg-destructive/90 text-destructive-foreground fixed top-0 right-0 left-0 z-50 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-all"
    >
      <WifiOff className="h-3.5 w-3.5" />
      <span>Modo sin conexión. Los cambios se sincronizarán al recuperar la red.</span>
    </aside>
  );
}
