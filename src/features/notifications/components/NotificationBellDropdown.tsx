"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  Megaphone,
  Trophy,
  Broom,
  Receipt,
  MessageSquare,
  CheckCircle2,
  CheckCheck,
  Trash2,
  X,
  ChevronRight,
} from "lucide-react";
import { useNotifications } from "../useNotifications";
import type { PisoProNotification, NotificationType } from "@/types";
import { cn } from "@/lib/utils";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "shopping_alert":
      return {
        icon: Megaphone,
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        text: "text-amber-700",
      };
    case "leaderboard_overtake":
      return {
        icon: Trophy,
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-600",
      };
    case "weekly_zone":
      return {
        icon: Broom,
        bg: "bg-teal-500/10",
        border: "border-teal-500/20",
        text: "text-teal-700",
      };
    case "expense_notice":
      return {
        icon: Receipt,
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        text: "text-[#194F6B]",
      };
    case "chat_mention":
      return {
        icon: MessageSquare,
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
        text: "text-[#31405F]",
      };
    case "debt_reminder":
      return {
        icon: BellRing,
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        text: "text-amber-700",
      };
    case "payment_sent":
      return {
        icon: Receipt,
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        text: "text-[#194F6B]",
      };
    case "payment_received":
      return {
        icon: CheckCheck,
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        text: "text-emerald-700",
      };
    case "chore_reminder":
    default:
      return {
        icon: CheckCircle2,
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        text: "text-emerald-700",
      };
  }
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} d`;
  } catch {
    return "";
  }
}

export function NotificationBellDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isEnabled,
    isSupported,
    markAsRead,
    markAllAsRead,
    clearAll,
    toggleNativePermission,
  } = useNotifications();

  // Cerrar al hacer clic fuera o pulsar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = (notif: PisoProNotification) => {
    markAsRead(notif.id);
    setIsOpen(false);
    const targetUrl = (notif.data?.url as string) || "/";
    router.push(targetUrl);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de Campana en el Header */}
      <button
        type="button"
        data-testid="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={
          unreadCount > 0
            ? `${unreadCount} notificaciones sin leer`
            : "Notificaciones del piso"
        }
        aria-label="Abrir centro de notificaciones"
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all active:scale-95",
          isOpen
            ? "border-[#31405F] bg-[#31405F] text-white shadow-xs"
            : unreadCount > 0
            ? "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
            : "border-[#BFC6CC]/60 bg-white text-[#607283] hover:bg-[#F4F7F8] hover:text-[#31405F] shadow-2xs"
        )}
      >
        {isEnabled ? (
          <BellRing className="h-4 w-4 stroke-[1.75]" />
        ) : (
          <Bell className="h-4 w-4 stroke-[1.75]" />
        )}

        {/* Badge de No Leídas */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF5722] px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Menú Desplegable / Popover */}
      {isOpen && (
        <div className="border-[#BFC6CC]/60 bg-white absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-150">
          {/* Header del Panel */}
          <div className="border-[#BFC6CC]/30 bg-[#F4F7F8] flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[#31405F] text-sm font-semibold tracking-tight">
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#31405F]/10 px-2 py-0.5 text-[11px] font-semibold text-[#31405F]">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Marcar todas como leídas"
                  className="text-[#607283] hover:text-[#31405F] flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Leídas</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  title="Vaciar notificaciones"
                  className="text-[#BFC6CC] hover:text-red-500 rounded-lg p-1 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#607283] hover:text-[#31405F] rounded-lg p-1 transition-colors ml-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Toggle de Notificaciones Nativas PWA */}
          {isSupported && (
            <div className="border-[#BFC6CC]/30 bg-white border-b px-4 py-2 flex items-center justify-between text-xs">
              <span className="text-[#607283] font-medium">
                Avisos en el navegador (PWA)
              </span>
              <button
                type="button"
                onClick={() => void toggleNativePermission()}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all",
                  isEnabled
                    ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                    : "bg-[#F4F7F8] text-[#607283] border border-[#BFC6CC]/50 hover:border-[#31405F]"
                )}
              >
                {isEnabled ? "Activadas" : "Activar"}
              </button>
            </div>
          )}

          {/* Lista de Notificaciones */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[#BFC6CC]/20">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F7F8] text-[#BFC6CC] mb-2">
                  <Bell className="h-5 w-5 stroke-[1.5]" />
                </div>
                <p className="text-[#31405F] text-xs font-semibold">
                  Todo al día
                </p>
                <p className="text-[#607283] text-[11px] mt-0.5">
                  No hay avisos pendientes en el piso.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const iconMeta = getNotificationIcon(notif.type);
                const IconComponent = iconMeta.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "flex items-start gap-3 p-3.5 cursor-pointer transition-colors hover:bg-[#F4F7F8]/80 text-left relative",
                      !notif.read && "bg-[#F4F7F8]/40"
                    )}
                  >
                    {/* Icono temático SVG */}
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border mt-0.5",
                        iconMeta.bg,
                        iconMeta.border,
                        iconMeta.text
                      )}
                    >
                      <IconComponent className="h-4 w-4 stroke-[1.75]" />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-baseline justify-between gap-1">
                        <h4
                          className={cn(
                            "text-xs truncate",
                            !notif.read
                              ? "font-bold text-[#31405F]"
                              : "font-medium text-[#31405F]/80"
                          )}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-[#8C9AA6] shrink-0 font-medium">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-[#607283] text-[11px] leading-relaxed mt-0.5 line-clamp-2">
                        {notif.body}
                      </p>
                    </div>

                    {/* Indicador de no leído */}
                    {!notif.read ? (
                      <span className="h-2 w-2 rounded-full bg-[#FF5722] shrink-0 self-center" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-[#BFC6CC] shrink-0 self-center" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Informativo */}
          {notifications.length > 0 && (
            <div className="border-[#BFC6CC]/30 bg-[#FAFBFC] border-t px-4 py-2 text-center text-[10px] text-[#8C9AA6]">
              Pulsa en cualquier aviso para ir a su sección
            </div>
          )}
        </div>
      )}
    </div>
  );
}
