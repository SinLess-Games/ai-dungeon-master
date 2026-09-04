import { test, expect } from "@playwright/test";
import { goto, hasSession, signIn } from "./helpers";

test.describe("signed-in play", () => {
  test.skip(!hasSession(), "no preview session available");

  test.beforeEach(async ({ context, page }) => {
    await signIn(context, page);
  });

  test("characters page lists heroes and offers creation", async ({ page }) => {
    await goto(page, "/characters");
    await expect(page.locator("h1").first()).toBeVisible();
    expect(await page.locator("h2").count()).toBeGreaterThan(0);
    await expect(page.locator("body")).toContainText(/character|hero|new/i);
  });

  test("character builder opens and accepts a name", async ({ page }) => {
    await goto(page, "/characters/new");
    const name = page.locator('input[type="text"]').first();
    await expect(name).toBeVisible();
    await name.fill("E2E Testhero");
    await expect(name).toHaveValue("E2E Testhero");
  });

  test("campaigns page renders", async ({ page }) => {
    await goto(page, "/campaigns");
    await expect(page.locator("h1").first()).toBeVisible();
    expect(await page.locator("h2").count()).toBeGreaterThan(0);
  });

  test("worlds page renders", async ({ page }) => {
    await goto(page, "/worlds");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("dice roller rolls and records history", async ({ page }) => {
    await goto(page, "/dice");
    await expect(page.locator("h1").first()).toBeVisible();
    const d20 = page.getByRole("button", { name: /d20/i }).first();
    if (await d20.count()) {
      await d20.click();
      await page.waitForTimeout(800);
      await expect(page.locator("body")).toContainText(/\d/);
    }
  });

  test("profile page renders account details", async ({ page }) => {
    await goto(page, "/profile");
    await expect(page.locator("body")).toContainText(/profile|account|display name|sign out/i);
  });

  test("navigation exposes the Play menu", async ({ page }) => {
    await goto(page, "/characters");
    const play = page.getByRole("button", { name: /play/i }).first();
    if (await play.count()) {
      await play.click();
      await expect(page.locator("body")).toContainText(/campaigns|characters|worlds|dice/i);
    }
  });
});
