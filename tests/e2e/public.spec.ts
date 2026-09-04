import { test, expect } from "@playwright/test";
import { goto } from "./helpers";

test.describe("public pages", () => {
  test("landing page renders with a single H1 and title", async ({ page }) => {
    await goto(page, "/");
    await expect(page).toHaveTitle(/.{10,}/);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(await page.locator("h1").count()).toBeLessThanOrEqual(1);
  });

  test("landing page links into the app", async ({ page }) => {
    await goto(page, "/");
    const links = await page.locator("a[href]").count();
    expect(links).toBeGreaterThan(2);
  });

  test("sign-in page renders", async ({ page }) => {
    await goto(page, "/auth");
    await expect(page.locator("body")).toContainText(/sign in|log in|email/i);
  });

  test("wiki loads with search and articles", async ({ page }) => {
    await goto(page, "/wiki");
    await expect(page.locator("h1").first()).toBeVisible();
    const search = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
    await expect(search).toBeVisible();
    await search.fill("fireball");
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText(/^\s*$/);
  });

  test("upgrade page shows plans", async ({ page }) => {
    await goto(page, "/upgrade");
    await expect(page.locator("body")).toContainText(/multiplayer|month|year|pass/i);
    expect(await page.locator("h2").count()).toBeGreaterThan(0);
  });

  test("unknown routes do not crash the app", async ({ page }) => {
    await goto(page, "/definitely-not-a-page");
    await expect(page.locator("body")).toBeVisible();
  });

  test("no uncaught console errors on the landing page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await goto(page, "/");
    expect(errors).toEqual([]);
  });
});
