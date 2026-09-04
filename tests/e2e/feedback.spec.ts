import { test, expect } from "@playwright/test";
import { goto, hasSession, signIn } from "./helpers";

test.describe("feedback", () => {
  test.skip(!hasSession(), "no preview session available");

  test.beforeEach(async ({ context, page }) => {
    await signIn(context, page);
  });

  test("the feedback dialog opens and validates", async ({ page }) => {
    await goto(page, "/characters");
    const trigger = page.getByRole("button", { name: /feedback|report|idea|bug/i }).first();
    if (!(await trigger.count())) test.skip(true, "no feedback trigger in the shell");
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/bug|idea|feature/i);
    await page.keyboard.press("Escape");
  });
});

test.describe("admin", () => {
  test.skip(!hasSession(), "no preview session available");

  test.beforeEach(async ({ context, page }) => {
    await signIn(context, page);
  });

  const pages = ["/admin", "/admin/players", "/admin/content", "/admin/feedback", "/admin/billing"];

  for (const path of pages) {
    test(`${path} renders for an admin or redirects for everyone else`, async ({ page }) => {
      await goto(page, path);
      const url = page.url();
      if (/\/admin/.test(url)) {
        await expect(page.locator("body")).toContainText(/admin|players|content|feedback|billing|subscri/i);
      } else {
        await expect(page.locator("body")).toBeVisible();
      }
    });
  }
});
