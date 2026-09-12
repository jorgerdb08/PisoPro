import { test, expect } from "@playwright/test";

test.describe("Realtime Flat Chat Module Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("Flatmate should access chat from home, see messages, send a message with mention, and verify realtime delivery", async ({
    page,
  }) => {
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
      // 2. Navigate to /chat via Home Chat Card
      const chatCard = page.getByTestId("home-chat-card");
      await expect(chatCard).toBeVisible({ timeout: 15000 });
      await chatCard.click();
      await expect(page).toHaveURL(/\/chat/);

      // 3. Verify chat header & welcome message
      await expect(page.getByText(/Canal en vivo del piso/i)).toBeVisible({ timeout: 15000 });

      // 4. Send a test message with @todos mention
      const uniqueMsg = `Aviso reunión del piso @todos ${Date.now()}`;
      const input = page.getByTestId("chat-message-input");
      await expect(input).toBeVisible();
      await input.fill(uniqueMsg);

      const sendBtn = page.getByTestId("chat-send-btn");
      await expect(sendBtn).toBeEnabled();
      await sendBtn.click();

      // 5. Verify message appears in feed
      await expect(page.getByText(uniqueMsg)).toBeVisible({ timeout: 15000 });

      // 6. Verify mention formatting
      await expect(page.locator("span", { hasText: "@todos" }).first()).toBeVisible();
    } finally {
      // 7. Logout to release session lease
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
