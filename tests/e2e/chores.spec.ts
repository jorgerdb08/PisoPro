import { test, expect } from "@playwright/test";

test.describe("Cleaning Rules & Weekly Rotation Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("Jorge should view assigned cleaning zone, navigate to /tareas, inspect the 3 zones, and register trash", async ({
    page,
  }) => {
    // 1. Initial navigation & profile selection
    await page.goto("/");
    await expect(page.getByText("Cargando PisoPro...")).not.toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Conectando con Supabase...")).not.toBeVisible({ timeout: 20000 });

    const jorgeCard = page.locator('[data-testid="profile-card-jorge"]');
    await expect(jorgeCard).toBeVisible({ timeout: 20000 });
    const releaseBtn = jorgeCard.locator('[data-testid="force-release-profile-jorge"]');
    if (await releaseBtn.isVisible()) {
      await releaseBtn.click();
      await page.waitForTimeout(600);
    }
    await jorgeCard.click();
    await expect(page.getByText(/Hola, Jorge/i)).toBeVisible({ timeout: 20000 });

    // 2. Verify Home dashboard shows ESTA SEMANA TE TOCA card
    await expect(page.getByText("ESTA SEMANA TE TOCA")).toBeVisible({ timeout: 15000 });

    // 3. Navigate to /tareas
    await page.goto("/tareas");
    await expect(page).toHaveURL(/\/tareas/);
    await expect(page.getByText("Limpieza y Contribución")).toBeVisible({ timeout: 20000 });

    // 4. Verify 3 tabs: Zonas, Basura, Contribución
    await expect(page.getByRole("button", { name: /Zonas/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Basura/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Contribución/i })).toBeVisible();

    // 5. Check the 3 main zones are present (Cocina, Salón, Baño)
    await expect(page.getByText(/Cocina/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Salón/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Baño/i).first()).toBeVisible({ timeout: 15000 });

    // 6. Switch to Basura tab and verify button "HE TIRADO LA BASURA"
    await page.getByRole("button", { name: /Basura/i }).click();
    const trashBtn = page.getByRole("button", { name: /HE TIRADO LA BASURA/i });
    await expect(trashBtn).toBeVisible({ timeout: 15000 });

    // 7. Switch to Contribución tab
    await page.getByRole("button", { name: /Contribución/i }).click();
    await expect(page.getByText("Estadísticas de Contribución")).toBeVisible({ timeout: 15000 });

    // 8. Logout
    await page.locator('[data-testid="logout-trigger"]').click();
    await expect(page.getByText(/¿Quién eres\?/i)).toBeVisible({ timeout: 15000 });


  });
});
