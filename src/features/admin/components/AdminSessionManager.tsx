"use client";

import React, { useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { Shield, Smartphone, Unlock, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSessionManager() {
  const { profiles, currentUser, forceReleaseUser, refreshProfiles } = useAuth();
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleForceRelease = async (userId: string, userName: string) => {
    setReleasingId(userId);
    setActionMessage(null);
    try {
      const ok = await forceReleaseUser(userId);
      if (ok) {
        setActionMessage({
          type: "success",
          text: `Sesión de ${userName} liberada con éxito. El perfil vuelve a estar disponible.`,
        });
      } else {
        setActionMessage({
          type: "error",
          text: `No se pudo liberar la sesión de ${userName}.`,
        });
      }
    } catch {
      setActionMessage({
        type: "error",
        text: `Error de red al intentar liberar la sesión.`,
      });
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[#31405F] text-sm font-semibold">Estado de Sesiones y Dispositivos</h3>
          <p className="text-[#607283] text-xs">
            Gestiona los bloqueos de perfiles y libera sesiones colgadas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshProfiles()}
          className="text-[#607283] hover:text-[#31405F] flex items-center gap-1 text-xs transition-colors"
          title="Actualizar estado"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {actionMessage && (
        <div
          data-testid="admin-action-message"
          className={cn(
            "flex items-center gap-2 rounded-xl p-3 text-xs font-medium transition-all animate-in fade-in-50",
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

      <div className="divide-[#BFC6CC]/40 border-[#BFC6CC]/60 rounded-2xl border divide-y overflow-hidden bg-white">
        {profiles.map((p) => {
          const isCurrentUser = currentUser?.id === p.id;
          const isBusyOtherDevice = p.is_busy && !p.is_current_device;
          const isCurrentSession = p.is_current_device;

          return (
            <div
              key={p.id}
              data-testid={`admin-session-row-${p.name.toLowerCase()}`}
              className="flex items-center justify-between p-3.5 transition-colors hover:bg-[#F4F7F8]"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F7F8] font-bold text-[#31405F]">
                    {p.name.charAt(0)}
                  </div>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                      isCurrentSession
                        ? "bg-[#194F6B]"
                        : isBusyOtherDevice
                        ? "bg-[#C995A2] animate-pulse"
                        : "bg-[#094152]"
                    )}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#31405F] text-sm font-semibold">{p.name}</span>
                    {p.role === "admin" && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#094152]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#094152]">
                        <Shield className="h-2.5 w-2.5" />
                        Admin
                      </span>
                    )}
                    {isCurrentUser && (
                      <span className="rounded-full bg-[#194F6B]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#194F6B]">
                        Tú
                      </span>
                    )}
                  </div>

                  <div className="text-[#607283] flex items-center gap-1.5 text-xs mt-0.5">
                    <Smartphone className="h-3 w-3" />
                    <span>
                      {isCurrentSession
                        ? "Activo en este dispositivo"
                        : isBusyOtherDevice
                        ? "Ocupado en otro dispositivo"
                        : "Sin dispositivo activo (Libre)"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {isBusyOtherDevice ? (
                  <button
                    type="button"
                    data-testid={`force-release-btn-${p.name.toLowerCase()}`}
                    disabled={releasingId === p.id}
                    onClick={() => void handleForceRelease(p.id, p.name)}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#C995A2]/15 px-2.5 py-1.5 text-xs font-semibold text-[#8B4B5B] hover:bg-[#C995A2]/30 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    <span>{releasingId === p.id ? "Liberando..." : "Forzar Liberación"}</span>
                  </button>
                ) : (
                  <span className="text-[#607283] text-xs font-medium">
                    {isCurrentSession ? "En uso" : "Disponible"}
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
