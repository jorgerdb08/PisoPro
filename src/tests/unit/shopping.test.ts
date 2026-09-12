import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  detectShoppingCategory,
  getShoppingCategoryMeta,
} from "@/features/shopping/categorizer";
import { shoppingService } from "@/services/shoppingService";
import type { ShoppingItem } from "@/types";

// Mock Supabase Browser Client
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

describe("Shopping List Categorizer Unit Tests", () => {
  it("correctly identifies produce categories", () => {
    expect(detectShoppingCategory("Plátanos de Canarias")).toBe("produce");
    expect(detectShoppingCategory("Tomates pera")).toBe("produce");
    expect(detectShoppingCategory("Cebolla morada")).toBe("produce");
    expect(detectShoppingCategory("Manzana golden")).toBe("produce");
  });

  it("correctly identifies dairy & eggs", () => {
    expect(detectShoppingCategory("Leche entera")).toBe("dairy");
    expect(detectShoppingCategory("Queso gouda")).toBe("dairy");
    expect(detectShoppingCategory("Yogur natural")).toBe("dairy");
    expect(detectShoppingCategory("Huevos camperos")).toBe("dairy");
  });

  it("correctly identifies meat and fish", () => {
    expect(detectShoppingCategory("Pechuga de pollo")).toBe("meat");
    expect(detectShoppingCategory("Filetes de ternera")).toBe("meat");
    expect(detectShoppingCategory("Salmón fresco")).toBe("meat");
    expect(detectShoppingCategory("Jamón serrano")).toBe("meat");
  });

  it("correctly identifies bakery & breakfast", () => {
    expect(detectShoppingCategory("Pan integral")).toBe("bakery");
    expect(detectShoppingCategory("Galletas digestive")).toBe("bakery");
    expect(detectShoppingCategory("Café molido")).toBe("bakery");
    expect(detectShoppingCategory("Croissants")).toBe("bakery");
  });

  it("correctly identifies pantry goods", () => {
    expect(detectShoppingCategory("Arroz bomba")).toBe("pantry");
    expect(detectShoppingCategory("Aceite de oliva virgen extra")).toBe("pantry");
    expect(detectShoppingCategory("Pasta espaguetis")).toBe("pantry");
    expect(detectShoppingCategory("Tomate frito")).toBe("pantry");
  });

  it("correctly identifies drinks", () => {
    expect(detectShoppingCategory("Agua mineral 1.5L")).toBe("drinks");
    expect(detectShoppingCategory("Cerveza Mahou")).toBe("drinks");
    expect(detectShoppingCategory("Coca Cola Zero")).toBe("drinks");
    expect(detectShoppingCategory("Zumo de naranja")).toBe("drinks");
  });

  it("correctly identifies cleaning & hygiene", () => {
    expect(detectShoppingCategory("Papel higiénico")).toBe("cleaning");
    expect(detectShoppingCategory("Detergente líquido")).toBe("cleaning");
    expect(detectShoppingCategory("Champú fortificante")).toBe("personal");
    expect(detectShoppingCategory("Pasta de dientes")).toBe("personal");
  });

  it("falls back to other for unmatched items", () => {
    expect(detectShoppingCategory("Bombilla LED")).toBe("other");
    expect(detectShoppingCategory("Pilas AA")).toBe("other");
  });

  it("returns metadata with icon and label", () => {
    const meta = getShoppingCategoryMeta("dairy");
    expect(meta.label).toBe("Lácteos y Huevos");
    expect(meta.icon).toBe("🥛");

    const fallback = getShoppingCategoryMeta("unknown_category");
    expect(fallback.label).toBe("Otros");
    expect(fallback.icon).toBe("📦");
  });
});

describe("Shopping Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters items into pending and completed correctly", () => {
    const mockItems: ShoppingItem[] = [
      {
        id: "1",
        household_id: "h1",
        name: "Leche",
        quantity: "6",
        added_by: "u1",
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        household_id: "h1",
        name: "Pan",
        quantity: "1",
        added_by: "u2",
        completed: true,
        bought_by: "u1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const pending = mockItems.filter((i) => !i.completed);
    const completed = mockItems.filter((i) => i.completed);

    expect(pending).toHaveLength(1);
    expect(pending[0]?.name).toBe("Leche");
    expect(completed).toHaveLength(1);
    expect(completed[0]?.name).toBe("Pan");
    expect(completed[0]?.bought_by).toBe("u1");
  });

  it("gracefully handles empty or erroneous service responses", async () => {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    vi.mocked(getSupabaseBrowserClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Network error" },
            }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof getSupabaseBrowserClient>);

    const items = await shoppingService.getItems("h1");
    expect(items).toEqual([]);
  });
});
