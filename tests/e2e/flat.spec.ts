import { test, expect } from "@playwright/test";

test.describe("Flat Management Module Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("Flatmate should navigate to /piso, view WiFi credentials, inspect roommates, check rules and contacts", async ({
    page,
  }) => {
    // 1. Initial navigation & profile selection
    await page.goto("/");
    await expect(page.getByText("Cargando PisoPro...")).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Conectando con Supabase...")).not.toBeVisible({ timeout: 15000 });

    // Select the first available flatmate
    const selectBtn = page.getByRole("button", { name: /Seleccionar/i }).first();
    await expect(selectBtn).toBeVisible({ timeout: 15000 });
    await selectBtn.click();
    await expect(page.getByText(/Hola,/i)).toBeVisible({ timeout: 15000 });

    try {
      // 2. Navigate to /piso via BottomNav
      const pisoNavLink = page.getByRole("link", { name: "Piso", exact: true });
      await expect(pisoNavLink).toBeVisible({ timeout: 15000 });
      await pisoNavLink.click();
      await expect(page).toHaveURL(/\/piso/);

      // 3. Verify flat header & details
      await expect(page.getByText("Nuestro piso")).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("3 Habitaciones")).toBeVisible();

      // 4. Verify WiFi Card
      const wifiCard = page.getByTestId("wifi-card");
      await expect(wifiCard).toBeVisible();
      await expect(page.getByText("PisoPro_5G_Fibra")).toBeVisible();
      await expect(page.getByTestId("wifi-password-value")).toHaveText("PisoPro2026!WiFi");

      // Test copy WiFi button
      const copyBtn = page.getByTestId("copy-wifi-btn");
      await expect(copyBtn).toBeVisible();
      await copyBtn.click();

      // 5. Verify flatmates cards
      await expect(page.getByTestId("flatmate-card-jorge")).toBeVisible();
      await expect(page.getByTestId("flatmate-card-samuel")).toBeVisible();
      await expect(page.getByTestId("flatmate-card-david")).toBeVisible();

      // 6. Switch to "Normas" tab
      const tabRules = page.getByTestId("tab-flat-rules");
      await tabRules.click();
      await expect(page.getByText("Horario de Silencio")).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("Cocina y Platos")).toBeVisible();

      // 7. Switch to "Contactos" tab
      const tabContacts = page.getByTestId("tab-flat-contacts");
      await tabContacts.click();
      await expect(page.getByText("Emergencias Generales")).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("Seguro del Hogar")).toBeVisible();
      await expect(page.getByText("112", { exact: true })).toBeVisible();
    } finally {
      // 8. Logout to release session lease
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
