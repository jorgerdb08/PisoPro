import React from "react";
import {
  Home,
  Zap,
  Droplet,
  Flame,
  Wifi,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Handshake,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryMeta {
  icon: LucideIcon;
  label: string;
  bg: string;
  border: string;
  text: string;
}

export function getCategoryMeta(category?: string): CategoryMeta {
  const norm = (category || "").toLowerCase();

  switch (norm) {
    case "alquiler":
    case "rent":
      return {
        icon: Home,
        label: "Alquiler",
        bg: "bg-[#31405F]/10",
        border: "border-[#31405F]/20",
        text: "text-[#31405F]",
      };
    case "luz":
    case "utilities":
      return {
        icon: Zap,
        label: "Luz",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        text: "text-amber-700",
      };
    case "agua":
    case "water":
      return {
        icon: Droplet,
        label: "Agua",
        bg: "bg-sky-500/10",
        border: "border-sky-500/20",
        text: "text-sky-700",
      };
    case "gas":
      return {
        icon: Flame,
        label: "Gas",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-700",
      };
    case "internet":
    case "wifi":
      return {
        icon: Wifi,
        label: "Internet",
        bg: "bg-[#094152]/10",
        border: "border-[#094152]/20",
        text: "text-[#094152]",
      };
    case "compras":
    case "groceries":
      return {
        icon: ShoppingCart,
        label: "Compras",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        text: "text-emerald-700",
      };
    case "cenas":
    case "dining":
      return {
        icon: UtensilsCrossed,
        label: "Cenas",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        text: "text-purple-700",
      };
    case "cleaning":
      return {
        icon: Sparkles,
        label: "Limpieza",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20",
        text: "text-cyan-700",
      };
    case "settlement":
      return {
        icon: Handshake,
        label: "Liquidación",
        bg: "bg-teal-500/10",
        border: "border-teal-500/20",
        text: "text-teal-700",
      };
    case "otros":
    case "other":
    default:
      return {
        icon: Package,
        label: "Otros gastos",
        bg: "bg-slate-500/10",
        border: "border-slate-500/20",
        text: "text-[#607283]",
      };
  }
}

interface ExpenseCategoryIconProps {
  category?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ExpenseCategoryIcon({
  category,
  className,
  size = "md",
}: ExpenseCategoryIconProps) {
  const meta = getCategoryMeta(category);
  const Icon = meta.icon;

  const sizeClasses = {
    sm: "h-7 w-7 rounded-lg",
    md: "h-9 w-9 rounded-xl",
    lg: "h-11 w-11 rounded-2xl",
  }[size];

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border transition-all",
        sizeClasses,
        meta.bg,
        meta.border,
        meta.text,
        className
      )}
      title={meta.label}
    >
      <Icon className={cn(iconSizes, "stroke-[1.85]")} />
    </div>
  );
}
