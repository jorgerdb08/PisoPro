export const DEFAULT_HOUSEHOLD_ID = "11111111-1111-4111-8111-111111111111";

export interface Flatmate {
  id: string;
  name: "Jorge" | "Samuel" | "David";
  role: "admin" | "member";
  color: string;
}

export const FLATMATES: Flatmate[] = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Jorge",
    role: "admin",
    color: "bg-blue-600",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Samuel",
    role: "member",
    color: "bg-amber-600",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "David",
    role: "member",
    color: "bg-emerald-600",
  },
];

export const CHORE_CATEGORIES = [
  { value: "bathroom", label: "Baño", icon: "🛁", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "kitchen", label: "Cocina", icon: "🍳", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { value: "trash", label: "Basura", icon: "🗑️", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  { value: "cleaning", label: "Limpieza", icon: "🧹", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { value: "living", label: "Salón", icon: "🛋️", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { value: "general", label: "General", icon: "📦", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
] as const;
