"use client";

import React from "react";
import { Users, AlertCircle } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { ProfileCard } from "./ProfileCard";

export function ProfileSelectorModal() {
  const {
    profiles,
    isClaiming,
    claimError,
    selectProfile,
    forceReleaseUser,
    currentUser,
  } = useAuth();

  const handleSelect = async (userId: string) => {
    await selectProfile(userId);
  };

  const isCurrentAdmin = currentUser?.role === "admin";

  return (
    <div className="flex min-h-screen flex-col justify-between px-4 py-8 sm:py-12 bg-[#FAFBFC]">
      <div className="space-y-6">
        {/* Header Branding */}
        <div className="space-y-2 pt-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#31405F] text-white shadow-xs">
            <Users className="h-6 w-6 stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-[#31405F] text-2xl font-bold tracking-tight">
              ¿Quién eres?
            </h1>
            <p className="text-[#607283] text-xs sm:text-sm">
              Selecciona tu perfil para asociar este dispositivo al piso
            </p>
          </div>
        </div>

        {/* Realtime Status Banner */}
        <div className="text-[#607283] flex items-center justify-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#094152]" />
          </span>
          <span className="flex items-center gap-1 font-medium text-[#31405F]">
            Control de sesiones en tiempo real activo
          </span>
        </div>

        {/* Error notification if claim was blocked */}
        {claimError && (
          <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-2.5 rounded-xl border border-[#C995A2]/50 bg-[#C995A2]/10 p-3.5 text-xs text-[#8B4B5B]">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="font-medium">{claimError}</p>
          </div>
        )}

        {/* Profile List */}
        <div className="space-y-3">
          {profiles.length > 0 ? (
            profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isClaiming={isClaiming}
                isCurrentAdmin={isCurrentAdmin}
                onSelect={handleSelect}
                onForceRelease={forceReleaseUser}
              />
            ))
          ) : (
            <div className="text-[#607283] flex flex-col items-center justify-center space-y-2 py-12 text-center text-xs">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#31405F] border-t-transparent" />
              <span>Conectando con Supabase...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-8 text-center">
        <div className="border-[#BFC6CC]/60 bg-white text-[#607283] inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] shadow-xs">
          <span>PisoPro · Convivencia compartida</span>
        </div>
      </div>
    </div>
  );
}
