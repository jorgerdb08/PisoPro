"use client";

import React, { useState } from "react";
import { TopHeader } from "@/components/layout/TopHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuth } from "@/features/auth/AuthContext";
import { ProfileSelectorModal } from "@/features/auth/components/ProfileSelectorModal";
import { AdminModal } from "@/features/admin/components/AdminModal";
import { FlatView } from "@/features/flat/components/FlatView";
import { Loader2, Shield, Smartphone, AlertTriangle } from "lucide-react";

export default function PisoPage() {
  const { currentUser, isLoading, deviceName, unlinkDevice } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-[#FAFBFC] flex min-h-screen flex-col items-center justify-center space-y-3 p-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#31405F] text-white shadow-xs">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-[#607283] text-xs font-semibold tracking-wide uppercase">
          Cargando datos del piso...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <ProfileSelectorModal />;
  }

  const isAdmin = currentUser.role === "admin";

  return (
    <div className="flex min-h-screen flex-col pb-24 bg-[#FAFBFC]">
      <TopHeader
        title="Piso"
        subtitle="Gestión y convivencia"
        userName={currentUser.name}
        userRole={currentUser.role}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      <main className="flex-1 space-y-4 px-4 py-4">
        {/* Banner de Administración exclusivo para Jorge (Admin) */}
        {isAdmin && (
          <div
            data-testid="admin-banner-card"
            className="flex items-center justify-between rounded-3xl border border-[#094152]/30 bg-[#094152]/10 p-4 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#094152] text-white shadow-xs">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#31405F]">Administración del Piso</h3>
                <p className="text-xs text-[#607283]">Gestionar dispositivos activos y permisos</p>
              </div>
            </div>
            <button
              type="button"
              data-testid="open-admin-from-piso"
              onClick={() => setIsAdminModalOpen(true)}
              className="rounded-xl bg-[#094152] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#194F6B] active:scale-95 shadow-xs"
            >
              Administrar
            </button>
          </div>
        )}

        {/* Flat Details & Shared info */}
        <FlatView />

        {/* Sección de Dispositivo Vinculado */}
        <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#31405F]">
              <Smartphone className="h-4 w-4 text-[#194F6B]" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Tu Dispositivo</h4>
            </div>
            <span className="rounded-full bg-[#094152]/10 px-2 py-0.5 text-[11px] font-semibold text-[#094152]">
              Vinculado
            </span>
          </div>

          <p className="text-xs text-[#607283]">
            Este terminal ({deviceName}) está asociado permanentemente a tu perfil ({currentUser.name}).
            No necesitas identificarte cada vez que abras la aplicación.
          </p>

          {!showUnlinkConfirm ? (
            <div className="pt-1">
              <button
                type="button"
                data-testid="unlink-device-trigger"
                onClick={() => setShowUnlinkConfirm(true)}
                className="text-xs text-[#8B4B5B] hover:text-[#C995A2] font-semibold transition-colors"
              >
                Desvincular este dispositivo
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#C995A2]/50 bg-[#C995A2]/10 p-3.5 space-y-2 text-xs text-[#8B4B5B]">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>¿Desvincular este dispositivo?</span>
              </div>
              <p className="text-[11px] text-[#8B4B5B]/90">
                Se liberará la sesión en Supabase y volverá a mostrarse la pantalla &quot;¿Quién eres?&quot;.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  data-testid="confirm-unlink-device-btn"
                  onClick={() => void unlinkDevice()}
                  className="rounded-xl bg-[#8B4B5B] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#723C4A] active:scale-95 shadow-xs"
                >
                  Sí, desvincular
                </button>
                <button
                  type="button"
                  onClick={() => setShowUnlinkConfirm(false)}
                  className="rounded-xl border border-[#BFC6CC]/70 bg-white px-3 py-1.5 text-xs font-semibold text-[#31405F] transition hover:bg-[#F4F7F8]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
