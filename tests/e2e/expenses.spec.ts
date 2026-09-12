import { test, expect } from "@playwright/test";

test.describe("Expenses Module & Debt Minimization Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("Flatmate should view balances, create a new shared expense and inspect settlements", async ({
    page,
    isMobile,
  }) => {
    const userName = isMobile ? "David" : "Jorge";

    // 1. Initial navigation & profile selection
    await page.goto("/");
    await expect(page.getByText("Cargando PisoPro...")).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Conectando con Supabase...")).not.toBeVisible({ timeout: 15000 });

    const userCard = page.locator(`[data-testid="profile-card-${userName.toLowerCase()}"]`);
    await expect(userCard).toBeVisible({ timeout: 15000 });
    const releaseBtn = userCard.locator(`[data-testid="force-release-profile-${userName.toLowerCase()}"]`);
    if (await releaseBtn.isVisible()) {
      await releaseBtn.click();
      await page.waitForTimeout(600);
    }
    await userCard.click();
    await expect(page.getByText(new RegExp(`Hola, ${userName}`, "i"))).toBeVisible({ timeout: 15000 });

    try {
      // 2. Navigate to /gastos via Home Balance Card
      await page.getByTestId("home-balance-card").click();
      await expect(page).toHaveURL(/\/gastos/);
      await expect(page.getByText("Gastos Compartidos")).toBeVisible({ timeout: 15000 });

      // 3. Verify tabs
      const tabBalances = page.getByTestId("tab-balances");
      const tabHistory = page.getByTestId("tab-history");
      await expect(tabBalances).toBeVisible();
      await expect(tabHistory).toBeVisible();

      // 4. Open Create Expense Modal
      const createBtn = page.getByTestId("open-create-expense-btn");
      await expect(createBtn).toBeVisible();
      await createBtn.click();

      const modal = page.getByTestId("create-expense-modal");
      await expect(modal).toBeVisible();

      // 5. Fill expense details (30€ divided by 3 = 10€ each)
      const uniqueTitle = `Ticket Mercadona ${Date.now()}`;
      await page.getByTestId("expense-desc-input").fill(uniqueTitle);
      await page.getByTestId("expense-amount-input").fill("30.00");

      // Submit
      await page.getByTestId("expense-submit-btn").click();
      await expect(modal).not.toBeVisible({ timeout: 15000 });

      // 6. Check Historial tab
      await tabHistory.click();
      await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("30,00 €").first()).toBeVisible();

      // 7. Check Balances & Deudas tab
      await tabBalances.click();
      await expect(page.getByTestId("balance-owed-to-me")).toBeVisible();
    } finally {
      // 8. Logout to leave state clean
      const logoutBtn = page.getByTestId("logout-trigger");
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await expect(page.locator("h1")).toContainText(/¿Quién eres\?/i, { timeout: 15000 });
      }
    }
  });
});
