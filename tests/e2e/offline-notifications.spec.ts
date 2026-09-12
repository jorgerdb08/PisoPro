import { test, expect } from "@playwright/test";

test.describe("Offline Resilience & Notification Controls Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("Flatmate should see notification toggle in header and experience offline/online banner feedback", async ({
    page,
    context,
  }) => {
    // 0. Grant notification permissions to browser context
    await context.grantPermissions(["notifications"]);

    // 1. Initial navigation & profile selection
    await page.goto("/");
    await expect(page.getByText("Cargando PisoPro...")).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Conectando con Supabase...")).not.toBeVisible({ timeout: 15000 });

    // Select the first available flatmate
    const selectBtn = page.getByRole("button", { name: /(Seleccionar|Entrar)/i }).first();
    await expect(selectBtn).toBeVisible({ timeout: 15000 });
    await selectBtn.click();
    await expect(page.getByText(/Hola,/i)).toBeVisible({ timeout: 15000 });

    try {
      // 2. Verify Notification Toggle button is present in TopHeader
      const notifToggle = page.getByTestId("notification-toggle-btn");
      await expect(notifToggle).toBeVisible({ timeout: 15000 });

      // Click notification toggle
      await notifToggle.click();

      // 3. Simulate going OFFLINE
      await context.setOffline(true);
      const offlineBanner = page.getByTestId("offline-banner");
      await expect(offlineBanner).toBeVisible({ timeout: 15000 });
      await expect(offlineBanner).toContainText(/Modo sin conexión/i);

      // 4. Simulate going back ONLINE
      await context.setOffline(false);
      const restoredBanner = page.getByTestId("online-restored-banner");
      await expect(restoredBanner).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/Conexión restablecida/i)).toBeVisible();
    } finally {
      // Restore network in case of failure
      await context.setOffline(false);

      // 5. Logout to release session lease
      const logoutBtn = page.getByTestId("logout-trigger");
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await expect(
          page.getByRole("heading", { name: /¿Quién eres\?/i })
        ).toBeVisible({ timeout: 15000 });
      }
    }
  });
});
