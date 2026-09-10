"use client";

import React from "react";
import { Users, AlertCircle, Sparkles, Radio } from "lucide-react";
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
    <div className="flex min-h-screen flex-col justify-between px-4 py-8 sm:py-12">
      <div className="space-y-6">
        {/* Header Branding */}
        <div className="space-y-2 pt-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30">
            <Users className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
              ¿Quién eres?
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Selecciona tu perfil para asociar este dispositivo al piso
            </p>
          </div>
        </div>

        {/* Realtime Status Banner */}
        <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Radio className="h-3 w-3 text-emerald-600" />
            Control de perfiles en tiempo real activo
          </span>
        </div>

        {/* Error notification if claim was blocked */}
        {claimError && (
          <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-400">
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
            <div className="text-muted-foreground flex flex-col items-center justify-center space-y-2 py-12 text-center text-xs">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              <span>Conectando con Supabase...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-8 text-center">
        <div className="border-border/70 bg-card text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] shadow-xs">
          <Sparkles className="h-3 w-3 text-emerald-600" />
          <span>Protección atómica contra accesos simultáneos</span>
        </div>
      </div>
    </div>
  );
}
