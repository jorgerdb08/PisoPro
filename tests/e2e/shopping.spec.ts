import { test, expect } from "@playwright/test";

test.describe("Shopping List Module Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("Flatmate should view shopping list, add a new item, and mark it as bought", async ({
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
      // 2. Navigate to /compra via Home Shopping Card
      const shoppingCard = page.getByTestId("home-shopping-card");
      await expect(shoppingCard).toBeVisible({ timeout: 15000 });
      await shoppingCard.click();
      await expect(page).toHaveURL(/\/compra/);
      await expect(page.getByText("Lista de la Compra")).toBeVisible({ timeout: 15000 });

      // 3. Verify tabs
      const tabPending = page.getByTestId("tab-pending-items");
      const tabCompleted = page.getByTestId("tab-completed-items");
      await expect(tabPending).toBeVisible();
      await expect(tabCompleted).toBeVisible();

      // 4. Open Create Item Modal
      const createBtn = page.getByTestId("open-create-item-btn");
      await expect(createBtn).toBeVisible();
      await createBtn.click();

      const modal = page.getByTestId("create-item-modal");
      await expect(modal).toBeVisible();

      // 5. Fill item details
      const uniqueName = `Avena Ecológica ${Date.now()}`;
      await page.getByTestId("item-name-input").fill(uniqueName);
      await page.getByTestId("item-quantity-input").fill("2 paquetes");

      // Submit
      await page.getByTestId("item-submit-btn").click();
      await expect(modal).not.toBeVisible({ timeout: 15000 });

      // 6. Check that the item appears in the pending list
      await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("2 paquetes")).toBeVisible();

      // 7. Toggle item as bought (click circular checkbox)
      const itemRow = page.locator(`[data-testid^="shopping-item-"]`, {
        hasText: uniqueName,
      });
      await expect(itemRow).toBeVisible();
      const toggleBtn = itemRow.locator(`[data-testid^="toggle-item-"]`);
      await toggleBtn.click();

      // 8. Go to "Comprados" tab and verify it's there
      await tabCompleted.click();
      await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 15000 });
    } finally {
      // 9. Logout to release session lease
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
