"use client";

import React from "react";
import Image from "next/image";
import { Shield, CheckCircle2, Lock, ArrowRight, Loader2, RefreshCw } from "lucide-react";
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

  const getAvatarBg = (name: string) => {
    switch (name) {
      case "Jorge":
        return "bg-blue-600";
      case "Samuel":
        return "bg-amber-600";
      case "David":
        return "bg-emerald-600";
      default:
        return "bg-slate-700";
    }
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        isAvailable && !isClaiming
          ? "cursor-pointer hover:border-emerald-500/60 hover:shadow-md active:scale-[0.99]"
          : "opacity-80",
        profile.is_current_device && "border-emerald-500 bg-emerald-500/5 shadow-sm",
        isBusyOtherDevice && "cursor-not-allowed border-rose-500/30 bg-rose-500/5"
      )}
      onClick={() => {
        if (isAvailable && !isClaiming) {
          onSelect(profile.id);
        }
      }}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          <div className="relative">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl font-bold text-white shadow-sm",
                getAvatarBg(profile.name)
              )}
            >
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                profile.name.charAt(0)
              )}
            </div>

            {/* Status indicator dot */}
            <span
              className={cn(
                "border-card absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2",
                isBusyOtherDevice ? "bg-rose-500" : "bg-emerald-500"
              )}
            >
              {isBusyOtherDevice ? (
                <Lock className="h-2 w-2 text-white" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </span>
          </div>

          {/* User Details */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-foreground text-base font-bold tracking-tight">
                {profile.name}
              </span>
              {profile.role === "admin" && (
                <Badge
                  variant="secondary"
                  className="gap-1 border-amber-500/20 bg-amber-500/10 px-1.5 py-0 text-[10px] font-semibold text-amber-700 dark:text-amber-400"
                >
                  <Shield className="h-2.5 w-2.5" />
                  Admin
                </Badge>
              )}
            </div>

            {/* Availability State */}
            <div className="mt-0.5 flex items-center gap-1.5 text-xs">
              {profile.is_current_device ? (
                <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Sesión activa en este dispositivo
                </span>
              ) : isBusyOtherDevice ? (
                <span className="flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                  <Lock className="h-3.5 w-3.5" />
                  En uso en otro dispositivo
                </span>
              ) : (
                <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Disponible
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action button / Status Icon */}
        <div className="flex items-center gap-2">
          {isClaiming ? (
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          ) : profile.is_current_device ? (
            <button
              type="button"
              className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              Entrar
            </button>
          ) : isBusyOtherDevice ? (
            <div className="flex items-center gap-1">
              <Badge variant="busy" className="px-2 py-1 text-[11px]">
                Bloqueado
              </Badge>
              {isCurrentAdmin && onForceRelease && (
                <button
                  type="button"
                  title="Forzar liberación de sesión (Admin)"
                  onClick={(e) => {
                    e.stopPropagation();
                    onForceRelease(profile.id);
                  }}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg p-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="bg-secondary text-foreground hover:bg-primary flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-semibold transition hover:text-white active:scale-95"
            >
              <span>Seleccionar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
