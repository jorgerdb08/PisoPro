"use client";

import React, { useState } from "react";
import { TopHeader } from "@/components/layout/TopHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuth } from "@/features/auth/AuthContext";
import { ProfileSelectorModal } from "@/features/auth/components/ProfileSelectorModal";
import { AdminModal } from "@/features/admin/components/AdminModal";
import { useCleaning } from "@/features/cleaning/useCleaning";
import { ZoneCard } from "@/features/cleaning/components/ZoneCard";
import { LotterySection } from "@/features/cleaning/components/LotterySection";
import { HelpRequestBanner } from "@/features/cleaning/components/HelpRequestBanner";
import { TrashHistoryView } from "@/features/cleaning/components/TrashHistoryView";
import { ContributionStatsView } from "@/features/cleaning/components/ContributionStatsView";
import { AdminCleaningModal } from "@/features/cleaning/components/AdminCleaningModal";
import {
  Loader2,
  Settings2,
  RotateCw,
  Sparkles,
  Trash2,
  BarChart3,
  Lock,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

export default function TareasPage() {
  const { currentUser, isLoading: isAuthLoading, logout } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCleaningAdminModalOpen, setIsCleaningAdminModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"zones" | "trash" | "stats">("zones");
  const [showAllZones, setShowAllZones] = useState<boolean>(false);

  const {
    assignments,
    lottery,
    activeHelpRequests,
    actionError,
    clearActionError,
    isLoading: isCleaningLoading,
    executeLottery,
    toggleTask,
    requestHelp,
    acceptHelp,
    refresh,
  } = useCleaning();

  const isAdmin = currentUser?.role === "admin";

  if (isAuthLoading) {
    return (
      <div className="bg-[#FAFBFC] flex min-h-screen flex-col items-center justify-center space-y-3 p-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#31405F] text-white shadow-xs">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-[#607283] text-xs font-semibold tracking-wide uppercase">
          Cargando Limpieza y Tareas...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <ProfileSelectorModal />;
  }

  return (
    <div className="flex min-h-screen flex-col pb-24 bg-[#FAFBFC]">
      <TopHeader
        title="PisoPro"
        userName={currentUser.name}
        userRole={currentUser.role}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onLogout={logout}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {isAdmin && (
        <AdminCleaningModal
          isOpen={isCleaningAdminModalOpen}
          onClose={() => setIsCleaningAdminModalOpen(false)}
          assignments={assignments}
          adminId={currentUser.id}
          onRefresh={refresh}
        />
      )}

      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full space-y-4">
        {/* Encabezado y Navegación entre Zonas, Basura y Contribución */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Limpieza y Contribución
            </h1>
            <p className="text-xs text-slate-500">
              Rotación semanal de zonas principales y gestión de basura
            </p>
          </div>

          <div className="flex items-center space-x-1.5">
            {isAdmin && (
              <button
                onClick={() => setIsCleaningAdminModalOpen(true)}
                title="Configuración de Limpieza (Admin)"
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5 text-xs font-medium"
              >
                <Settings2 className="w-3.5 h-3.5 text-[#31405F]" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            <button
              onClick={() => void refresh()}
              title="Actualizar datos"
              className="p-2 bg-white hover:bg-slate-100 text-slate-500 rounded-xl border border-slate-200 shadow-2xs transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isCleaningLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Pestañas de Vista */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab("zones")}
            className={`py-2 px-2.5 rounded-lg transition-all text-center flex items-center justify-center space-x-1.5 ${
              activeTab === "zones"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zonas</span>
          </button>
          <button
            onClick={() => setActiveTab("trash")}
            className={`py-2 px-2.5 rounded-lg transition-all text-center flex items-center justify-center space-x-1.5 ${
              activeTab === "trash"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Basura</span>
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`py-2 px-2.5 rounded-lg transition-all text-center flex items-center justify-center space-x-1.5 ${
              activeTab === "stats"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Contribución</span>
          </button>
        </div>

        {/* Notificación de Error de Negocio (ej: Intento de limpiar zona ajena) */}
        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center justify-between animate-fade-in shadow-xs">
            <div className="flex items-center space-x-2">
              <Lock className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={clearActionError}
              className="ml-2 text-rose-500 hover:text-rose-700 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab 1: ZONAS DE LIMPIEZA */}
        {activeTab === "zones" && (() => {
          const isLotteryLocked = Boolean(lottery?.is_locked);
          const myZone = assignments.find((z) => z.assigned_user_id === currentUser.id);
          const myHelpingZones = assignments.filter(
            (z) => z.assigned_user_id !== currentUser.id && z.helpers.some((h) => h.helper_id === currentUser.id)
          );
          const myActiveZones = [myZone, ...myHelpingZones].filter(Boolean) as typeof assignments;
          const otherZones = assignments.filter(
            (z) => z.assigned_user_id !== currentUser.id && !z.helpers.some((h) => h.helper_id === currentUser.id)
          );

          return (
            <div className="space-y-4">
              {/* Banner de Sorteo Inicial / Estado (desaparece al fijarse) */}
              <LotterySection
                lottery={lottery}
                assignments={assignments}
                isAdmin={isAdmin}
                onExecuteLottery={executeLottery}
              />

              {/* Solicitudes de ayuda activas */}
              <HelpRequestBanner
                helpRequests={activeHelpRequests}
                onAcceptHelp={acceptHelp}
              />

              {/* Si el sorteo está fijado: Solo sale la zona que tiene que hacer el usuario */}
              {isLotteryLocked ? (
                <div className="space-y-4">
                  {myActiveZones.length > 0 ? (
                    myActiveZones.map((zone) => (
                      <ZoneCard
                        key={zone.zone_id}
                        zone={zone}
                        currentUserId={currentUser.id}
                        onToggleTask={toggleTask}
                        onRequestHelp={requestHelp}
                        onAcceptHelp={acceptHelp}
                      />
                    ))
                  ) : (
                    <div className="p-6 bg-white border border-slate-200/90 rounded-2xl text-center text-xs text-slate-500 shadow-xs">
                      No tienes una zona asignada para esta semana.
                    </div>
                  )}

                  {/* Acceso opcional a ver las zonas de los compañeros (colapsado) */}
                  {otherZones.length > 0 && (
                    <div className="pt-1">
                      <button
                        onClick={() => setShowAllZones(!showAllZones)}
                        className="w-full py-2 px-3 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/70 transition-colors flex items-center justify-center space-x-1.5"
                      >
                        {showAllZones ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Ocultar zonas de compañeros</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver zonas de compañeros ({otherZones.length})</span>
                          </>
                        )}
                      </button>

                      {showAllZones && (
                        <div className="space-y-4 mt-3">
                          {otherZones.map((zone) => (
                            <ZoneCard
                              key={zone.zone_id}
                              zone={zone}
                              currentUserId={currentUser.id}
                              onToggleTask={toggleTask}
                              onRequestHelp={requestHelp}
                              onAcceptHelp={acceptHelp}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Antes del sorteo: vista previa */
                <div className="space-y-4">
                  {assignments.map((zone) => (
                    <ZoneCard
                      key={zone.zone_id}
                      zone={zone}
                      currentUserId={currentUser.id}
                      onToggleTask={toggleTask}
                      onRequestHelp={requestHelp}
                      onAcceptHelp={acceptHelp}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Tab 2: HISTORIAL DE BASURA */}
        {activeTab === "trash" && <TrashHistoryView />}

        {/* Tab 3: ESTADÍSTICAS DE CONTRIBUCIÓN */}
        {activeTab === "stats" && <ContributionStatsView />}
      </main>

      <BottomNav />
    </div>
  );
}
