import { SHOPPING_CATEGORIES } from "@/lib/constants";

export type ShoppingCategoryValue = (typeof SHOPPING_CATEGORIES)[number]["value"];

export function detectShoppingCategory(itemName: string): ShoppingCategoryValue {
  const name = itemName.toLowerCase().trim();

  // Limpieza y Hogar
  if (
    /papel|detergente|suavizante|lejia|lejía|friegaplatos|fairy|estropajo|bayeta|basura|limpiador/i.test(
      name
    )
  ) {
    return "cleaning";
  }

  // Higiene personal
  if (
    /champu|champú|\bgel\b|desodorante|pasta de dientes|dentífrico|colgate|crema|jabon|jabón/i.test(
      name
    )
  ) {
    return "personal";
  }

  // Bebidas (antes de frutas para capturar zumos de naranja, etc.)
  if (
    /agua|cerveza|refresco|coca|fanta|zumo|vino|bebida|\bte\b|\bté\b|infusion|infusión/i.test(
      name
    )
  ) {
    return "drinks";
  }

  // Lácteos y Huevos
  if (/leche|queso|yogur|huevo|mantequilla|nata/i.test(name)) {
    return "dairy";
  }

  // Carne y Pescado
  if (
    /pollo|carne|ternera|cerdo|hamburgues|salchich|pescad|salmon|salmón|merluza|atun|atún|jamon|jamón/i.test(
      name
    )
  ) {
    return "meat";
  }

  // Panadería y Desayuno
  if (/pan\b|pan |galleta|cereal|croissant|boller|café|cafe|magdalen/i.test(name)) {
    return "bakery";
  }

  // Despensa y Conservas (antes de verdura fresca para tomate frito, etc.)
  if (
    /arroz|pasta|macarron|espaguet|aceite|vinagre|\bsal\b|azucar|azúcar|harina|tomate frito|tomate triturado|legumbre|garbanz|lentej|conserva/i.test(
      name
    )
  ) {
    return "pantry";
  }

  // Producción / Frutería
  if (
    /manzan|plátan|platano|naranj|fresa|limon|limón|aguacate|tomate|lechuga|cebolla|patata|zanahoria|ajo|fruta|verdur/i.test(
      name
    )
  ) {
    return "produce";
  }

  return "other";
}

export function getShoppingCategoryMeta(categoryValue: string) {
  const found = SHOPPING_CATEGORIES.find((c) => c.value === categoryValue);
  if (found) return found;
  return {
    value: "other" as const,
    label: "Otros",
    icon: "📦",
    color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };
}
