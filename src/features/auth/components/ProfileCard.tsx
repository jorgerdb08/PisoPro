"use client";

import React from "react";
import { Lock, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProfileAvailability } from "@/services/authService";

interface ProfileCardProps {
  profile: ProfileAvailability;
  isClaiming: boolean;
  isCurrentAdmin?: boolean;
  onSelect: (userId: string) => void;
  onForceRelease?: (userId: string) => void;
}

export function ProfileCard({
  profile,
  isClaiming,
  isCurrentAdmin = false,
  onSelect,
  onForceRelease,
}: ProfileCardProps) {
  const isBusyOtherDevice = profile.is_busy && !profile.is_current_device;
  const isAvailable = !profile.is_busy || profile.is_current_device;
  const canForceRelease = Boolean((isCurrentAdmin || profile.role === "admin") && onForceRelease);

  const getAvatarStyles = (name: string) => {
    switch (name) {
      case "Jorge":
        return "bg-[#31405F] text-white border-[#31405F]";
      case "Samuel":
        return "bg-[#094152] text-white border-[#094152]";
      case "David":
        return "bg-[#194F6B] text-white border-[#194F6B]";
      default:
        return "bg-[#31405F] text-white border-[#31405F]";
    }
  };

  return (
    <Card
      data-testid={`profile-card-${profile.name.toLowerCase()}`}
      className={cn(
        "relative overflow-hidden transition-all duration-150 border-[#BFC6CC]/60 bg-white",
        isAvailable && !isClaiming
          ? "cursor-pointer hover:border-[#31405F]/40 hover:shadow-xs active:scale-[0.99]"
          : "opacity-90",
        profile.is_current_device && "border-[#31405F] ring-1 ring-[#31405F] shadow-xs",
        isBusyOtherDevice && "cursor-not-allowed border-[#C995A2]/50 bg-[#C995A2]/10"
      )}
      onClick={() => {
        if (isAvailable && !isClaiming) {
          onSelect(profile.id);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Initial Avatar */}
            <div className="relative">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl font-bold text-sm tracking-wide shadow-xs",
                  getAvatarStyles(profile.name)
                )}
              >
                {profile.name.charAt(0)}
              </div>

              {/* Status indicator dot */}
              <span
                className={cn(
                  "absolute -right-1 -bottom-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white",
                  isBusyOtherDevice ? "bg-[#C995A2]" : "bg-[#094152]"
                )}
              />
            </div>

            {/* User Details */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#31405F] text-base font-bold tracking-tight">
                  👤 {profile.name}
                </span>
                {profile.role === "admin" && (
                  <Badge
                    variant="secondary"
                    className="gap-1 border-[#BFC6CC]/60 bg-[#F4F7F8] px-2 py-0 text-[10px] font-medium text-[#31405F]"
                  >
                    Admin
                  </Badge>
                )}
              </div>

              {/* Availability State */}
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                {profile.is_current_device ? (
                  <span className="flex items-center gap-1 font-semibold text-[#094152]">
                    <span className="h-2 w-2 rounded-full bg-[#094152]" />
                    Sesión activa en este dispositivo
                  </span>
                ) : isBusyOtherDevice ? (
                  <span className="flex items-center gap-1 font-semibold text-[#8B4B5B]">
                    <span className="h-2 w-2 rounded-full bg-[#C995A2]" />
                    🔴 {profile.name} está en uso
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-semibold text-[#094152]">
                    <span className="h-2 w-2 rounded-full bg-[#094152]" />
                    🟢 Disponible
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action button / Status Icon */}
          <div className="flex items-center gap-2">
            {isClaiming ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#31405F]" />
            ) : profile.is_current_device ? (
              <button
                type="button"
                data-testid={`select-profile-${profile.name.toLowerCase()}`}
                className="rounded-xl bg-[#31405F] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#194F6B] active:scale-95 shadow-xs"
              >
                Entrar
              </button>
            ) : isBusyOtherDevice ? (
              <div className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className="border-[#C995A2]/60 text-[#8B4B5B] bg-[#C995A2]/15 px-2 py-0.5 text-[11px] font-semibold"
                >
                  <Lock className="mr-1 h-3 w-3" />
                  En uso
                </Badge>
                {canForceRelease && (
                  <button
                    type="button"
                    data-testid={`force-release-profile-${profile.name.toLowerCase()}`}
                    title="Desvincular dispositivo (Admin)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onForceRelease?.(profile.id);
                    }}
                    className="text-[#607283] hover:bg-[#F4F7F8] hover:text-[#31405F] rounded-lg p-1.5 transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                data-testid={`select-profile-${profile.name.toLowerCase()}`}
                className="flex items-center gap-1 rounded-xl border border-[#BFC6CC]/70 bg-[#F4F7F8] px-3.5 py-1.5 text-xs font-semibold text-[#31405F] transition hover:bg-[#31405F] hover:text-white hover:border-[#31405F] active:scale-95"
              >
                <span>Seleccionar</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Informative message when in use on another device */}
        {isBusyOtherDevice && (
          <div className="mt-2.5 pt-2 border-t border-[#C995A2]/30 text-[11px] text-[#8B4B5B] font-medium flex items-center gap-1.5">
            <Lock className="h-3 w-3 shrink-0" />
            <span>Este usuario ya está utilizando PisoPro en otro dispositivo.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
