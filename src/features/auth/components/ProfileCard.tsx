"use client";

import React from "react";
import { CheckCircle2, Lock, ArrowRight, Loader2, RefreshCw } from "lucide-react";
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

  const getAvatarStyles = (name: string) => {
    switch (name) {
      case "Jorge":
        return "bg-slate-900 text-white border-slate-900";
      case "Samuel":
        return "bg-emerald-800 text-white border-emerald-800";
      case "David":
        return "bg-zinc-800 text-white border-zinc-800";
      default:
        return "bg-slate-800 text-white border-slate-800";
    }
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-150 border-slate-200 bg-white",
        isAvailable && !isClaiming
          ? "cursor-pointer hover:border-slate-300 hover:shadow-xs active:scale-[0.99]"
          : "opacity-80",
        profile.is_current_device && "border-slate-900 ring-1 ring-slate-900 shadow-xs",
        isBusyOtherDevice && "cursor-not-allowed border-rose-200 bg-rose-50/30"
      )}
      onClick={() => {
        if (isAvailable && !isClaiming) {
          onSelect(profile.id);
        }
      }}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3.5">
          {/* Minimalist Initial Avatar */}
          <div className="relative">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full font-semibold text-sm tracking-wide shadow-xs",
                getAvatarStyles(profile.name)
              )}
            >
              {profile.name.charAt(0)}
            </div>

            {/* Status indicator dot */}
            <span
              className={cn(
                "absolute -right-0.5 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white",
                isBusyOtherDevice ? "bg-rose-500" : "bg-emerald-500"
              )}
            />
          </div>

          {/* User Details */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-slate-900 text-base font-semibold tracking-tight">
                {profile.name}
              </span>
              {profile.role === "admin" && (
                <Badge
                  variant="secondary"
                  className="gap-1 border-slate-200 bg-slate-100 px-2 py-0 text-[10px] font-medium text-slate-700"
                >
                  Admin
                </Badge>
              )}
            </div>

            {/* Availability State */}
            <div className="mt-0.5 flex items-center gap-1.5 text-xs">
              {profile.is_current_device ? (
                <span className="flex items-center gap-1 font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Sesión activa en este dispositivo
                </span>
              ) : isBusyOtherDevice ? (
                <span className="flex items-center gap-1 font-medium text-rose-600">
                  <Lock className="h-3.5 w-3.5" />
                  En uso en otro dispositivo
                </span>
              ) : (
                <span className="flex items-center gap-1 font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Disponible
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action button / Status Icon */}
        <div className="flex items-center gap-2">
          {isClaiming ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-700" />
          ) : profile.is_current_device ? (
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 active:scale-95"
            >
              Entrar
            </button>
          ) : isBusyOtherDevice ? (
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="border-rose-200 text-rose-700 px-2 py-0.5 text-[11px]">
                En uso
              </Badge>
              {isCurrentAdmin && onForceRelease && (
                <button
                  type="button"
                  title="Forzar liberación de sesión (Admin)"
                  onClick={(e) => {
                    e.stopPropagation();
                    onForceRelease(profile.id);
                  }}
                  className="text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg p-1.5 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-900 hover:text-white hover:border-slate-900 active:scale-95"
            >
              <span>Seleccionar</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
