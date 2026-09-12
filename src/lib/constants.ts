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

export const EXPENSE_CATEGORIES = [
  { value: "groceries", label: "Supermercado", icon: "🛒", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { value: "cleaning", label: "Limpieza / Hogar", icon: "🧼", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "utilities", label: "Facturas / Luz / Gas", icon: "💡", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { value: "internet", label: "Internet / WiFi", icon: "📶", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  { value: "dining", label: "Comida / Ocio", icon: "🍕", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  { value: "other", label: "Otros gastos", icon: "📦", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  { value: "settlement", label: "Liquidación", icon: "💸", color: "bg-teal-500/10 text-teal-600 border-teal-500/20" },
] as const;

export const SHOPPING_CATEGORIES = [
  { value: "produce", label: "Frutas y Verduras", icon: "🍎", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { value: "dairy", label: "Lácteos y Huevos", icon: "🥛", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { value: "meat", label: "Carne y Pescado", icon: "🥩", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  { value: "bakery", label: "Panadería y Desayuno", icon: "🍞", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { value: "pantry", label: "Despensa y Conservas", icon: "🥫", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  { value: "drinks", label: "Bebidas", icon: "🧃", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "cleaning", label: "Limpieza y Hogar", icon: "🧹", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  { value: "personal", label: "Higiene Personal", icon: "🧴", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { value: "other", label: "Otros", icon: "📦", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
] as const;

export const QUICK_SHOPPING_PRESETS = [
  { name: "Leche", quantity: "6 briks", category: "dairy" },
  { name: "Huevos", quantity: "1 docena", category: "dairy" },
  { name: "Papel higiénico", quantity: "1 paquete", category: "cleaning" },
  { name: "Aceite de oliva", quantity: "1 botella", category: "pantry" },
  { name: "Café", quantity: "1 paquete", category: "bakery" },
  { name: "Pan de molde", quantity: "1 bolsa", category: "bakery" },
  { name: "Plátanos", quantity: "1 kg", category: "produce" },
  { name: "Detergente", quantity: "1 botella", category: "cleaning" },
  { name: "Bolsas de basura", quantity: "1 rollo", category: "cleaning" },
  { name: "Agua", quantity: "1 pack 6x1.5L", category: "drinks" },
] as const;

