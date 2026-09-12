import React from "react";
import { Shield, Home, LogOut } from "lucide-react";
import { NotificationToggle } from "@/features/notifications/components/NotificationToggle";
import { cn } from "@/lib/utils";

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  userRole?: "admin" | "member";
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  className?: string;
}

export function TopHeader({
  title = "PisoPro",
  subtitle = "Nuestro piso",
  userName,
  userRole,
  onLogout,
  onOpenAdmin,
  className,
}: TopHeaderProps) {
  return (
    <header
      className={cn(
        "border-slate-200/80 bg-white/90 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
          <Home className="h-4 w-4 stroke-[1.75]" />
        </div>
        <div>
          <h1 className="text-slate-900 text-base font-semibold tracking-tight">{title}</h1>
          <p className="text-slate-500 text-xs">{subtitle}</p>
        </div>
      </div>

      {userName && (
        <div className="flex items-center gap-2">
          <NotificationToggle />

          <div className="border-slate-200 bg-slate-50 text-slate-800 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            {userRole === "admin" && <Shield className="h-3 w-3 text-slate-700" />}
            <span>{userName}</span>
          </div>

          {userRole === "admin" && onOpenAdmin && (
            <button
              type="button"
              data-testid="admin-panel-trigger"
              onClick={onOpenAdmin}
              title="Panel de Administración del Piso"
              className="border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors active:scale-95"
            >
              <Shield className="h-4 w-4" />
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              data-testid="logout-trigger"
              onClick={onLogout}
              title="Cerrar sesión y liberar perfil"
              className="border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors active:scale-95"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </header>
  );
}
