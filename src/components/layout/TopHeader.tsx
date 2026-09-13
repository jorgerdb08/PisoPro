import React from "react";
import { Shield, Home } from "lucide-react";
import { NotificationToggle } from "@/features/notifications/components/NotificationToggle";
import { FLAT_INFO } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  userRole?: "admin" | "member";
  onOpenAdmin?: () => void;
  className?: string;
}

export function TopHeader({
  title = "PisoPro",
  subtitle = FLAT_INFO.address,
  userName,
  userRole,
  onOpenAdmin,
  className,
}: TopHeaderProps) {
  return (
    <header
      className={cn(
        "border-[#BFC6CC]/60 bg-[#EEF2F6]/95 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#31405F] text-white shadow-xs">
          <Home className="h-4 w-4 stroke-[1.75]" />
        </div>
        <div>
          <h1 className="text-[#31405F] text-base font-semibold tracking-tight">{title}</h1>
          <p className="text-[#607283] text-xs">{subtitle}</p>
        </div>
      </div>

      {userName && (
        <div className="flex items-center gap-2">
          <NotificationToggle />

          <div className="border-[#BFC6CC]/60 bg-white text-[#31405F] flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#094152]" />
            {userRole === "admin" && <Shield className="h-3 w-3 text-[#31405F]" />}
            <span>{userName}</span>
          </div>

          {userRole === "admin" && onOpenAdmin && (
            <button
              type="button"
              data-testid="admin-panel-trigger"
              onClick={onOpenAdmin}
              title="Panel de Administración del Piso"
              className="border-[#BFC6CC]/60 text-[#31405F] bg-white hover:bg-[#F4F7F8] flex h-8 w-8 items-center justify-center rounded-lg border transition-colors active:scale-95 shadow-2xs"
            >
              <Shield className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </header>
  );
}
