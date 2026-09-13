import { test, expect } from "@playwright/test";

test.describe("Admin Permissions & RBAC Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("Jorge (Admin) should see admin trigger, open panel, inspect sessions and tabs", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Cargando PisoPro...")).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Conectando con Supabase...")).not.toBeVisible({ timeout: 15000 });

    // Select Jorge
    const jorgeCard = page.locator('[data-testid="profile-card-jorge"]');
    await expect(jorgeCard).toBeVisible({ timeout: 15000 });
    const releaseBtn = jorgeCard.locator('[data-testid="force-release-profile-jorge"]');
    if (await releaseBtn.isVisible()) {
      await releaseBtn.click();
      await page.waitForTimeout(600);
    }
    await jorgeCard.click();
    await expect(page.getByText(/Hola, Jorge/i)).toBeVisible({ timeout: 15000 });

    // Verify Admin Panel trigger is present in TopHeader
    const adminTrigger = page.getByTestId("admin-panel-trigger");
    await expect(adminTrigger).toBeVisible();

    // Open Admin Modal
    await adminTrigger.click();
    const adminModal = page.getByTestId("admin-modal");
    await expect(adminModal).toBeVisible();

    // Verify Admin tabs
    await expect(page.getByTestId("admin-tab-sessions")).toBeVisible();
    await expect(page.getByTestId("admin-tab-house")).toBeVisible();
    await expect(page.getByTestId("admin-tab-roles")).toBeVisible();

    // Verify sessions manager content
    await expect(page.getByText("Estado de Sesiones y Dispositivos")).toBeVisible();
    await expect(page.getByTestId("admin-session-row-jorge")).toBeVisible();
    await expect(page.getByTestId("admin-session-row-samuel")).toBeVisible();
    await expect(page.getByTestId("admin-session-row-david")).toBeVisible();

    // Switch to "Info Piso" tab
    await page.getByTestId("admin-tab-house").click();
    await expect(page.getByText("PISO-2026-MAD-PRO")).toBeVisible();

    // Switch to "Permisos" tab
    await page.getByTestId("admin-tab-roles").click();
    await expect(page.getByText("Matriz de Permisos del Piso")).toBeVisible();

    // Re-select Sessions tab to unlink device
    await page.getByTestId("admin-tab-sessions").click();
    const unlinkJorgeBtn = page.getByTestId("force-release-btn-jorge");
    await expect(unlinkJorgeBtn).toBeVisible();
    await unlinkJorgeBtn.click();

    // Verify returning back to "¿Quién eres?" screen
    await expect(page.locator("h1")).toContainText(/¿Quién eres\?/i, { timeout: 15000 });
  });

  test("Samuel (Member) should NOT see admin panel trigger", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Cargando PisoPro...")).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Conectando con Supabase...")).not.toBeVisible({ timeout: 15000 });

    // Select Samuel
    await expect(page.getByText("Samuel")).toBeVisible({ timeout: 15000 });
    await page.getByText("Samuel").click();
    await expect(page.getByText(/Hola, Samuel/i)).toBeVisible({ timeout: 15000 });

    // Verify Admin Panel trigger is NOT visible / not in header
    const adminTrigger = page.getByTestId("admin-panel-trigger");
    await expect(adminTrigger).not.toBeVisible();

    // Samuel unlinks device from /piso explicitly
    await page.goto("/piso");
    const unlinkTrigger = page.getByTestId("unlink-device-trigger");
    await expect(unlinkTrigger).toBeVisible({ timeout: 10000 });
    await unlinkTrigger.click();

    const confirmBtn = page.getByTestId("confirm-unlink-device-btn");
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    await expect(page.getByText("Cargando datos del piso...")).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator("h1")).toContainText(/¿Quién eres\?/i, { timeout: 15000 });
  });
});
