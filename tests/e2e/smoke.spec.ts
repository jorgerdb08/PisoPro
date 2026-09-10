import { test, expect } from "@playwright/test";

test.describe("PisoPro PWA Smoke Test", () => {
  test("should load the home page and have correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/PisoPro/i);
  });

  test("should have PWA manifest link in head", async ({ page }) => {
    await page.goto("/");
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);
  });

  test("should serve valid manifest.webmanifest with 200 OK", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.name).toBe("PisoPro - Gestión de Convivencia");
    expect(body.display).toBe("standalone");
    expect(body.icons.length).toBeGreaterThan(0);
  });

  test("should serve service worker sw.js with 200 OK", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("pisopro-v1");
  });

  test("should serve PWA icon assets with 200 OK", async ({ request }) => {
    const res192 = await request.get("/icons/icon-192x192.png");
    expect(res192.status()).toBe(200);
    expect(res192.headers()["content-type"]).toContain("image/png");

    const res512 = await request.get("/icons/icon-512x512.png");
    expect(res512.status()).toBe(200);
    expect(res512.headers()["content-type"]).toContain("image/png");
  });
});
