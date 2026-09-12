"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Wallet, MessageSquare, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onQuickAction?: () => void;
}

export function BottomNav({ onQuickAction }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Inicio", href: "/", icon: Home },
    { label: "Tareas", href: "/tareas", icon: CheckSquare },
    { label: "Gastos", href: "/gastos", icon: Wallet },
    { label: "Chat", href: "/chat", icon: MessageSquare },
    { label: "Piso", href: "/piso", icon: Users },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="border-slate-200/80 bg-white/95 pb-safe fixed right-0 bottom-0 left-0 z-40 mx-auto max-w-md border-t px-3 backdrop-blur-lg"
    >
      <div className="flex h-16 items-center justify-around">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "font-semibold text-slate-900"
                  : "text-slate-400 hover:text-slate-700"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.25px]" : "stroke-[1.75px]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Quick action button */}
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={onQuickAction}
            aria-label="Crear nuevo elemento"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95"
          >
            <Plus className="h-5 w-5 stroke-[2.25]" />
          </button>
        </div>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "font-semibold text-slate-900"
                  : "text-slate-400 hover:text-slate-700"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.25px]" : "stroke-[1.75px]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
