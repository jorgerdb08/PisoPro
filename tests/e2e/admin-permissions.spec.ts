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
    await expect(page.getByText("Jorge")).toBeVisible({ timeout: 15000 });
    await page.getByText("Jorge").click();
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

    // Close Modal
    await page.getByTestId("admin-modal-close").click();
    await expect(adminModal).not.toBeVisible();

    // Logout to release profile lease cleanly
    await page.getByTestId("logout-trigger").click();
    await expect(page.getByText("Cargando PisoPro...")).not.toBeVisible({ timeout: 15000 });
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

    // Logout to release profile lease cleanly
    await page.getByTestId("logout-trigger").click();
    await expect(page.getByText("Cargando PisoPro...")).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator("h1")).toContainText(/¿Quién eres\?/i, { timeout: 15000 });
  });
});
