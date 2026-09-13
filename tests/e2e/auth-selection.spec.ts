import { test, expect } from "@playwright/test";

test.describe("Profile Selection & Concurrency Flow", () => {
  test("should display '¿Quién eres?' and all 3 flatmates", async ({ page }) => {
    await page.goto("/");

    // Wait for Supabase live fetch to complete
    await expect(page.getByText("Cargando PisoPro...")).not.toBeVisible({ timeout: 15000 });

    // Verify main question
    await expect(page.locator("h1")).toContainText(/¿Quién eres\?/i);

    // Verify all 3 profiles are visible
    await expect(page.getByText("Jorge")).toBeVisible();
    await expect(page.getByText("Samuel")).toBeVisible();
    await expect(page.getByText("David")).toBeVisible();

    // Verify Admin badge is present for Jorge
    await expect(page.getByText("Admin")).toBeVisible();
  });

  test("should claim a profile, enter dashboard, and allow logout to release profile", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");

    // Wait for Supabase live fetch to complete
    await expect(page.getByText("Cargando PisoPro...")).not.toBeVisible({ timeout: 15000 });

    // Concurrent project safety: Desktop tests Jorge, Mobile tests David
    const targetName = isMobile ? "David" : "Jorge";
    const profileCard = page.locator(`[data-testid="profile-card-${targetName.toLowerCase()}"]`);
    await expect(profileCard).toBeVisible({ timeout: 15000 });

    const releaseBtn = profileCard.locator(`[data-testid="force-release-profile-${targetName.toLowerCase()}"]`);
    if (await releaseBtn.isVisible()) {
      await releaseBtn.click();
      await page.waitForTimeout(600);
    }

    await profileCard.click();

    // Verify dashboard rendered for target user
    await expect(
      page.getByText(new RegExp(`Hola, ${targetName}`, "i"))
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("En línea")).toBeVisible();

    // Unlink device explicitly from /piso
    await page.goto("/piso");
    const unlinkTrigger = page.getByTestId("unlink-device-trigger");
    await expect(unlinkTrigger).toBeVisible({ timeout: 10000 });
    await unlinkTrigger.click();

    const confirmBtn = page.getByTestId("confirm-unlink-device-btn");
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify returning back to "¿Quién eres?" screen
    await expect(page.getByText("Cargando datos del piso...")).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator("h1")).toContainText(/¿Quién eres\?/i, { timeout: 15000 });
  });
});
