"use client";

import React from "react";
import Image from "next/image";
import { AlertCircle, AlertTriangle, Home, X } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { ProfileCard } from "./ProfileCard";

export function ProfileSelectorModal() {
  const {
    profiles,
    isClaiming,
    claimError,
    revokedNotification,
    selectProfile,
    forceReleaseUser,
    currentUser,
    clearRevokedNotification,
  } = useAuth();

  const handleSelect = async (userId: string) => {
    await selectProfile(userId);
  };

  const isCurrentAdmin = currentUser?.role === "admin";

  return (
    <div className="flex min-h-screen flex-col justify-between px-4 py-8 sm:py-12 bg-[#FAFBFC]">
      <div className="mx-auto w-full max-w-sm space-y-6">
        {/* App Logo & Header */}
        <div className="space-y-3 pt-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#31405F] shadow-md shadow-[#31405F]/15">
            <Image
              src="/icons/icon-192x192.png"
              alt="PisoPro"
              width={56}
              height={56}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="space-y-1">
            <p className="text-[#607283] text-xs font-semibold uppercase tracking-widest">
              PisoPro
            </p>
            <h1 className="text-[#31405F] text-2xl font-bold tracking-tight">
              ¿Quién eres?
            </h1>
            <p className="text-[#7A8C9E] text-xs">
              Selecciona tu perfil en este dispositivo
            </p>
          </div>
        </div>

        {/* Revoked Notification Banner */}
        {revokedNotification && (
          <div
            data-testid="revoked-session-banner"
            className="animate-in fade-in slide-in-from-top-2 flex items-center justify-between gap-2.5 rounded-2xl border border-[#C995A2]/60 bg-[#C995A2]/15 p-3.5 text-xs text-[#8B4B5B] shadow-xs"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#8B4B5B]" />
              <p className="font-semibold">{revokedNotification}</p>
            </div>
            <button
              type="button"
              onClick={clearRevokedNotification}
              className="rounded-lg p-1 text-[#8B4B5B] hover:bg-[#C995A2]/20 transition"
              aria-label="Cerrar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Claim Error (e.g. User already in use) */}
        {claimError && (
          <div
            data-testid="claim-error-banner"
            className="animate-in fade-in slide-in-from-top-2 flex items-start gap-2.5 rounded-2xl border border-[#C995A2]/60 bg-[#C995A2]/15 p-3.5 text-xs text-[#8B4B5B] shadow-xs"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Usuario no disponible</p>
              <p className="text-[11px] mt-0.5">{claimError}</p>
            </div>
          </div>
        )}

        {/* Flatmate Profiles List */}
        <div className="space-y-3 pt-1">
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

      {/* Footer Branding */}
      <div className="pt-8 text-center">
        <div className="border-[#BFC6CC]/60 bg-white text-[#607283] inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] shadow-xs">
          <Home className="h-3 w-3 text-[#607283]" />
          <span>PisoPro · Convivencia Organizada</span>
        </div>
      </div>
    </div>
  );
}
