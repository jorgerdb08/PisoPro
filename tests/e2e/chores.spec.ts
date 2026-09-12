import { test, expect } from "@playwright/test";

test.describe("Chores Module & Weekly Rotation Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("Jorge should see assigned chore on home, navigate to /tareas, complete a task and create a new chore", async ({
    page,
  }) => {
    // 1. Initial navigation & profile selection
    await page.goto("/");
    await expect(page.getByText("Cargando PisoPro...")).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Conectando con Supabase...")).not.toBeVisible({ timeout: 15000 });

    await expect(page.getByText("Jorge")).toBeVisible({ timeout: 15000 });
    await page.getByText("Jorge").click();
    await expect(page.getByText(/Hola, Jorge/i)).toBeVisible({ timeout: 15000 });

    // 2. Navigate to /tareas
    await page.getByTestId("home-tasks-card").click();
    await expect(page).toHaveURL(/\/tareas/);
    await expect(page.getByText("Tareas del Hogar")).toBeVisible({ timeout: 15000 });

    // 3. Check tabs and tasks list
    const tabMy = page.getByTestId("tab-my-chores");
    const tabAll = page.getByTestId("tab-all-chores");
    const tabCompleted = page.getByTestId("tab-completed-chores");

    await expect(tabMy).toBeVisible();
    await expect(tabAll).toBeVisible();
    await expect(tabCompleted).toBeVisible();

    // Switch to "Todas"
    await tabAll.click();
    await expect(page.getByText("Limpiar baño")).toBeVisible();

    // 4. Admin buttons visibility for Jorge
    const rotateBtn = page.getByTestId("rotate-chores-btn");
    const createBtn = page.getByTestId("create-chore-btn");
    await expect(rotateBtn).toBeVisible();
    await expect(createBtn).toBeVisible();

    // 5. Open Create Chore Modal and add a task
    await createBtn.click();
    const createModal = page.getByTestId("create-chore-modal");
    await expect(createModal).toBeVisible();

    const uniqueTitle = `Tarea Test ${Date.now()}`;
    await page.getByTestId("chore-title-input").fill(uniqueTitle);
    await page.getByTestId("chore-submit-btn").click();

    await expect(createModal).not.toBeVisible();
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 15000 });

    // 6. Logout to leave state clean
    await page.getByTestId("logout-trigger").click();
    await expect(page.getByText("Cargando PisoPro...")).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator("h1")).toContainText(/¿Quién eres\?/i, { timeout: 15000 });
  });
});
