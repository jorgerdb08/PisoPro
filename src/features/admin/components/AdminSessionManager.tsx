"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { Smartphone, CheckCircle2, AlertCircle, RefreshCw, Unplug } from "lucide-react";
import { cn } from "@/lib/utils";

function formatActivity(lastSeen: string | null, status: string): { text: string; isOnline: boolean } {
  if (!lastSeen || status !== "ACTIVE") {
    return { text: "Sin actividad", isOnline: false };
  }
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000));
  if (diffSec < 60) {
    return { text: `Activo hace ${diffSec} segundos`, isOnline: true };
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return { text: `Activo hace ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`, isOnline: true };
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return { text: `Activo hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`, isOnline: false };
  }
  const diffDays = Math.floor(diffHours / 24);
  return { text: `Activo hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`, isOnline: false };
}

export function AdminSessionManager() {
  const { profiles, currentUser, forceReleaseUser, refreshProfiles } = useAuth();
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Re-render every 5s to keep "Activo hace X segundos" ticker fresh
  useEffect(() => {
    const timer = setInterval(() => setTick((prev) => prev + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  const handleUnlink = async (userId: string, userName: string) => {
    setReleasingId(userId);
    setActionMessage(null);
    try {
      const ok = await forceReleaseUser(userId);
      if (ok) {
        setActionMessage({
          type: "success",
          text: `Dispositivo de ${userName} desvinculado con éxito. El usuario vuelve a estar libre.`,
        });
      } else {
        setActionMessage({
          type: "error",
          text: `No se pudo desvincular el dispositivo de ${userName}.`,
        });
      }
    } catch {
      setActionMessage({
        type: "error",
        text: `Error de red al intentar desvincular el dispositivo.`,
      });
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[#31405F] text-sm font-bold flex items-center gap-1.5">
            <Smartphone className="h-4 w-4 text-[#194F6B]" />
            <span>📱 Dispositivos activos</span>
          </h3>
          <p className="text-[#607283] text-xs mt-0.5">
            Estado en tiempo real de los dispositivos vinculados al piso.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshProfiles()}
          className="text-[#607283] hover:text-[#31405F] flex items-center gap-1 text-xs transition-colors rounded-lg border border-[#BFC6CC]/60 px-2 py-1 bg-white shadow-2xs"
          title="Actualizar estado"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Refrescar</span>
        </button>
      </div>

      {actionMessage && (
        <div
          data-testid="admin-action-message"
          className={cn(
            "flex items-center gap-2 rounded-2xl p-3 text-xs font-medium transition-all animate-in fade-in-50",
            actionMessage.type === "success"
              ? "bg-[#094152]/10 text-[#094152] border border-[#094152]/20"
              : "bg-[#C995A2]/15 text-[#8B4B5B] border border-[#C995A2]/30"
          )}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Device List */}
      <div className="divide-[#BFC6CC]/40 border-[#BFC6CC]/60 rounded-2xl border divide-y overflow-hidden bg-white shadow-2xs">
        <div className="bg-[#F4F7F8] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#607283]">
          DISPOSITIVOS
        </div>

        {profiles.map((p) => {
          const isCurrentUser = currentUser?.id === p.id;
          const isActive = p.status === "ACTIVE" || (p.is_busy && !p.is_current_device) || p.is_current_device;
          const activity = formatActivity(p.last_seen, isActive ? "ACTIVE" : "UNCLAIMED");

          return (
            <div
              key={p.id}
              data-testid={`admin-session-row-${p.name.toLowerCase()}`}
              className="flex items-center justify-between p-4 transition-colors hover:bg-[#F4F7F8]/50"
            >
              <div className="flex items-center gap-3.5">
                {/* Status Dot */}
                <span
                  className={cn(
                    "flex h-3 w-3 shrink-0 rounded-full",
                    isActive
                      ? "bg-[#094152] shadow-xs ring-2 ring-[#094152]/20"
                      : "bg-[#C995A2]"
                  )}
                />

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#31405F] text-sm font-bold">
                      {isActive ? "🟢" : "🔴"} {p.name}
                    </span>
                    {p.role === "admin" && (
                      <span className="rounded-md bg-[#094152]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#094152]">
                        Admin
                      </span>
                    )}
                    {isCurrentUser && (
                      <span className="rounded-md bg-[#194F6B]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#194F6B]">
                        Este dispositivo
                      </span>
                    )}
                  </div>

                  {/* Device Name and Activity */}
                  <div className="text-xs text-[#607283] mt-0.5 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <span className="font-semibold text-[#31405F]">
                      {isActive ? p.device_name || "Dispositivo móvil" : "Sin dispositivo"}
                    </span>
                    <span className="hidden sm:inline text-[#BFC6CC]">·</span>
                    <span className={cn("text-[11px]", isActive ? "text-[#094152] font-medium" : "text-[#607283]")}>
                      {isActive ? activity.text : "Sin actividad"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div>
                {isActive ? (
                  <button
                    type="button"
                    data-testid={`force-release-btn-${p.name.toLowerCase()}`}
                    disabled={releasingId === p.id}
                    onClick={() => void handleUnlink(p.id, p.name)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#C995A2]/60 bg-[#C995A2]/15 px-3 py-1.5 text-xs font-semibold text-[#8B4B5B] hover:bg-[#C995A2]/30 transition-all active:scale-95 disabled:opacity-50 shadow-2xs"
                  >
                    <Unplug className="h-3.5 w-3.5" />
                    <span>{releasingId === p.id ? "Desvinculando..." : "Desvincular dispositivo"}</span>
                  </button>
                ) : (
                  <span className="rounded-lg bg-[#F4F7F8] px-2.5 py-1 text-[11px] font-medium text-[#607283]">
                    Libre
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
