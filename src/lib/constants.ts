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
    color: "bg-[#31405F] text-white",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Samuel",
    role: "member",
    color: "bg-[#094152] text-white",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "David",
    role: "member",
    color: "bg-[#194F6B] text-white",
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

export const FLAT_INFO = {
  name: "Nuestro piso",
  address: "Calle Mayor 14, 3ºB",
  city: "Madrid, 28013",
  wifiSsid: "PisoPro_5G_Fibra",
  wifiPass: "PisoPro2026!WiFi",
  landlordName: "D. Manuel García",
  landlordPhone: "+34 612 345 678",
  landlordEmail: "alquiler.mayor14@gmail.com",
  rentAmount: "1.200 €/mes (400 €/persona)",
  rentDueDay: "Día 1 al 5 de cada mes",
  rooms: [
    { number: 1, name: "Habitación Principal (Exterior)", occupantId: "22222222-2222-4222-8222-222222222222", occupantName: "Jorge" },
    { number: 2, name: "Habitación Mediana (Balcón)", occupantId: "33333333-3333-4333-8333-333333333333", occupantName: "Samuel" },
    { number: 3, name: "Habitación Estudio (Tranquila)", occupantId: "44444444-4444-4444-8444-444444444444", occupantName: "David" },
  ],
} as const;

export const FLAT_RULES = [
  {
    id: "rule-1",
    title: "Horario de Silencio",
    description: "De domingo a jueves a partir de las 23:00h y viernes/sábados a partir de la 01:00h respeto al descanso.",
    icon: "🌙",
    category: "descanso",
  },
  {
    id: "rule-2",
    title: "Cocina y Platos",
    description: "Fregar los platos y sartenes inmediatamente o antes de ir a dormir. Dejar la encimera despejada.",
    icon: "🍳",
    category: "limpieza",
  },
  {
    id: "rule-3",
    title: "Visitas y Quedadas",
    description: "Avisar por el chat del piso si van a venir visitas a dormir o si se planea cena con amigos.",
    icon: "👥",
    category: "convivencia",
  },
  {
    id: "rule-4",
    title: "Basura y Reciclaje",
    description: "Bajar la basura al contenedor al llenarse la bolsa, no dejar acumulado en la cocina.",
    icon: "🗑️",
    category: "limpieza",
  },
  {
    id: "rule-5",
    title: "Climatización Responsable",
    description: "Apagar calefacción y aire acondicionado al salir de las habitaciones o del piso.",
    icon: "💡",
    category: "suministros",
  },
] as const;

export const EMERGENCY_CONTACTS = [
  {
    name: "Emergencias Generales",
    role: "Policía, Bomberos, Ambulancia",
    phone: "112",
    icon: "🚨",
    isUrgent: true,
  },
  {
    name: "Seguro del Hogar",
    role: "Póliza Nº 8492041-H (Mapfre)",
    phone: "+34 918 000 112",
    icon: "🛡️",
    isUrgent: false,
  },
  {
    name: "Fontanero / Averías de Agua",
    role: "Servicio de guardia de la finca",
    phone: "+34 600 112 233",
    icon: "🔧",
    isUrgent: false,
  },
  {
    name: "Portería / Administrador",
    role: "Comunidad de Propietarios",
    phone: "+34 915 223 344",
    icon: "🏢",
    isUrgent: false,
  },
  {
    name: "Casero (Manuel)",
    role: "Propietario del piso",
    phone: "+34 612 345 678",
    icon: "🔑",
    isUrgent: false,
  },
] as const;


