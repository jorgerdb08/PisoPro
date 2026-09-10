import React from "react";
import { Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  userRole?: "admin" | "member";
  className?: string;
}

export function TopHeader({
  title = "PisoPro",
  subtitle = "Nuestro piso",
  userName,
  userRole,
  className,
}: TopHeaderProps) {
  return (
    <header
      className={cn(
        "border-border/70 bg-background/85 pt-safe sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3.5 backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-sm shadow-emerald-600/30">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-foreground text-base font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        </div>
      </div>

      {userName && (
        <div className="border-border/80 bg-secondary/80 text-foreground flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
          {userRole === "admin" && <Shield className="h-3 w-3 text-emerald-600" />}
          <span>{userName}</span>
        </div>
      )}
    </header>
  );
}
