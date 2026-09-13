"use client";

import React, { useState, useEffect } from "react";
import { X, Shield, Users, Home, Check, Info } from "lucide-react";
import { AdminSessionManager } from "./AdminSessionManager";
import { cn } from "@/lib/utils";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "sessions" | "house" | "roles";

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("sessions");

  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="admin-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-[#BFC6CC]/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#BFC6CC]/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#094152]/10 text-[#094152]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[#31405F] text-lg font-bold">Administración del Piso</h2>
              <p className="text-[#607283] text-xs">Exclusivo para Jorge (Admin)</p>
            </div>
          </div>
          <button
            type="button"
            data-testid="admin-modal-close"
            onClick={onClose}
            className="text-[#607283] hover:text-[#31405F] flex h-9 w-9 items-center justify-center rounded-xl border border-[#BFC6CC]/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1.5 p-1 my-4 rounded-xl bg-[#F4F7F8] border border-[#BFC6CC]/60">
          <button
            type="button"
            data-testid="admin-tab-sessions"
            onClick={() => setActiveTab("sessions")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
              activeTab === "sessions"
                ? "bg-white text-[#31405F] shadow-xs"
                : "text-[#607283] hover:text-[#31405F]"
            )}
          >
            <span>📱 Dispositivos</span>
          </button>
          <button
            type="button"
            data-testid="admin-tab-house"
            onClick={() => setActiveTab("house")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
              activeTab === "house"
                ? "bg-white text-[#31405F] shadow-xs"
                : "text-[#607283] hover:text-[#31405F]"
            )}
          >
            <Home className="h-3.5 w-3.5" />
            <span>Info Piso</span>
          </button>
          <button
            type="button"
            data-testid="admin-tab-roles"
            onClick={() => setActiveTab("roles")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
              activeTab === "roles"
                ? "bg-white text-[#31405F] shadow-xs"
                : "text-[#607283] hover:text-[#31405F]"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Permisos</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {activeTab === "sessions" && <AdminSessionManager />}

          {activeTab === "house" && (
            <div className="space-y-4 text-xs">
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
                <div>
                  <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                    Nombre del Hogar
                  </span>
                  <p className="text-foreground text-sm font-semibold mt-0.5">Nuestro piso</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                    Identificador de Piso
                  </span>
                  <p className="font-mono text-muted-foreground text-xs mt-0.5 bg-secondary/80 p-2 rounded-lg inline-block">
                    PISO-2026-MAD-PRO
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                    Compañeros Registrados (3)
                  </span>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#F4F7F8]">
                      <span className="font-medium text-[#31405F]">Jorge</span>
                      <span className="text-[10px] font-semibold text-[#094152] bg-[#094152]/10 px-2 py-0.5 rounded-full">
                        Administrador
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#F4F7F8]">
                      <span className="font-medium text-[#31405F]">Samuel</span>
                      <span className="text-[10px] font-medium text-[#607283] bg-[#BFC6CC]/30 px-2 py-0.5 rounded-full">
                        Miembro
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#F4F7F8]">
                      <span className="font-medium text-[#31405F]">David</span>
                      <span className="text-[10px] font-medium text-[#607283] bg-[#BFC6CC]/30 px-2 py-0.5 rounded-full">
                        Miembro
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "roles" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-2xl border border-[#BFC6CC]/60 bg-white p-4 space-y-3">
                <div className="flex items-center gap-2 text-[#31405F] font-semibold">
                  <Info className="h-4 w-4 text-[#194F6B]" />
                  <span>Matriz de Permisos del Piso</span>
                </div>

                <div className="divide-y divide-[#BFC6CC]/40 border border-[#BFC6CC]/60 rounded-xl overflow-hidden text-[11px]">
                  <div className="grid grid-cols-3 p-2 bg-[#F4F7F8] font-semibold text-[#607283]">
                    <span>Acción</span>
                    <span className="text-center">Admin (Jorge)</span>
                    <span className="text-center">Miembros</span>
                  </div>
                  <div className="grid grid-cols-3 p-2 items-center">
                    <span className="font-medium text-[#31405F]">Liberar sesiones colgadas</span>
                    <span className="text-center text-[#094152] font-bold flex justify-center"><Check className="h-3.5 w-3.5" /></span>
                    <span className="text-center text-[#607283] font-medium">—</span>
                  </div>
                  <div className="grid grid-cols-3 p-2 items-center bg-[#F4F7F8]/50">
                    <span className="font-medium text-[#31405F]">Reasignar tareas de otros</span>
                    <span className="text-center text-[#094152] font-bold flex justify-center"><Check className="h-3.5 w-3.5" /></span>
                    <span className="text-center text-[#607283] font-medium">—</span>
                  </div>
                  <div className="grid grid-cols-3 p-2 items-center">
                    <span className="font-medium text-[#31405F]">Configuración del piso</span>
                    <span className="text-center text-[#094152] font-bold flex justify-center"><Check className="h-3.5 w-3.5" /></span>
                    <span className="text-center text-[#607283] font-medium">—</span>
                  </div>
                  <div className="grid grid-cols-3 p-2 items-center bg-[#F4F7F8]/50">
                    <span className="font-medium text-[#31405F]">Completar tareas propias</span>
                    <span className="text-center text-[#094152] font-bold flex justify-center"><Check className="h-3.5 w-3.5" /></span>
                    <span className="text-center text-[#094152] font-bold flex justify-center"><Check className="h-3.5 w-3.5" /></span>
                  </div>
                  <div className="grid grid-cols-3 p-2 items-center">
                    <span className="font-medium text-[#31405F]">Añadir gastos y tickets</span>
                    <span className="text-center text-[#094152] font-bold flex justify-center"><Check className="h-3.5 w-3.5" /></span>
                    <span className="text-center text-[#094152] font-bold flex justify-center"><Check className="h-3.5 w-3.5" /></span>
                  </div>
                  <div className="grid grid-cols-3 p-2 items-center bg-[#F4F7F8]/50">
                    <span className="font-medium text-[#31405F]">Lista de compra y chat</span>
                    <span className="text-center text-[#094152] font-bold flex justify-center"><Check className="h-3.5 w-3.5" /></span>
                    <span className="text-center text-[#094152] font-bold flex justify-center"><Check className="h-3.5 w-3.5" /></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
