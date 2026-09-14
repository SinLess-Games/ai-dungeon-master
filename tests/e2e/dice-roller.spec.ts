import { expect, test } from "@playwright/test";

test("rolls dice expressions, validates input, and manages recent rolls", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/dice");
  await expect(page.getByRole("heading", { name: "Dice roller", exact: true })).toBeVisible();
  const expression = page.getByLabel("Dice expression", { exact: true });
  await expression.fill("1d20+4-8");
  await expression.press("Enter");
  const latest = page.getByRole("region", { name: "Latest roll" });
  const total = Number(await latest.locator(".dice-total").innerText());
  expect(total).toBeGreaterThanOrEqual(-3);
  expect(total).toBeLessThanOrEqual(16);
  await expect(latest.getByRole("listitem")).toHaveCount(3);
  const rolls = (await latest.getByLabel("Individual 1d20 rolls").innerText())
    .split(", ")
    .map(Number);
  expect(total).toBe(rolls[0]! + 4 - 8);

  await expression.fill("d1001");
  await page.getByRole("button", { name: "Roll dice", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("1000");
  await expect(page.locator(".dice-history-list > li")).toHaveCount(1);
  await page.getByRole("button", { name: "Roll d1000", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  const thousand = Number(await latest.locator(".dice-total").innerText());
  expect(thousand).toBeGreaterThanOrEqual(1);
  expect(thousand).toBeLessThanOrEqual(1000);

  await expression.fill("2d6+1d4-3");
  await expression.press("Enter");
  await expect(latest.getByRole("listitem")).toHaveCount(3);
  await page.getByRole("button", { name: "Roll again", exact: true }).click();
  await expect(page.locator(".dice-history-list > li")).toHaveCount(4);
  await page.getByRole("button", { name: "Clear history", exact: true }).click();
  await expect(page.getByText("No rolls yet.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});

test("opens from Play and search, supports custom sides, and reloads its route", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".codex-play-dropdown > summary").click();
  await page.getByRole("link", { name: "Dice Open", exact: true }).click();
  await expect(page).toHaveURL(/\/dice$/);
  await page.getByLabel("Dice expression", { exact: true }).fill("1d137");
  await page.getByRole("button", { name: "Roll dice", exact: true }).click();
  await expect(page.locator(".dice-history-list > li")).toHaveCount(1);
  await page.getByRole("button", { name: "Search Codex", exact: true }).click();
  await page.getByLabel("Search pages").fill("Home");
  await page.locator(".codex-search-results").getByRole("link").click();
  await page.locator(".codex-play-dropdown > summary").click();
  await page.getByRole("link", { name: "Dice Open", exact: true }).click();
  await expect(page.locator(".dice-history-list > li")).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Dice roller", exact: true })).toBeVisible();
  await expect(page.locator(".dice-history-list > li")).toHaveCount(1);
  await page.getByRole("button", { name: "Search Codex", exact: true }).click();
  await page.getByLabel("Search pages").fill("dice");
  await expect(page.locator(".codex-search-results").getByRole("link")).toContainText(
    "Dice roller",
  );
});

test("shares tray rolls with the page and persists them across reloads", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/dice");
  await page.getByRole("button", { name: "Open dice tray", exact: true }).click();
  const tray = page.getByRole("dialog", { name: "Dice Tray", exact: true });
  const expression = tray.getByLabel("Dice expression", { exact: true });
  await expect(expression).toBeFocused();
  await expression.fill("1d20+4-8");
  await expression.press("Enter");
  await expect(page.locator(".dice-history-list > li")).toHaveCount(1);
  await expect(tray.locator("ol > li")).toHaveCount(1);
  await expect(
    tray.locator("section[aria-live] ").getByText("1d20+4-8", { exact: true }),
  ).toBeVisible();

  await expression.fill("1d1001");
  await expression.press("Enter");
  await expect(tray.getByRole("alert")).toContainText("1000");
  await expect(tray.locator("ol > li")).toHaveCount(1);
  await tray.getByRole("button", { name: "d1000", exact: true }).click();
  await expect(tray.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".dice-history-list > li")).toHaveCount(2);
  const total = Number(await page.locator(".dice-total").innerText());
  expect(total).toBeGreaterThanOrEqual(1);
  expect(total).toBeLessThanOrEqual(1000);
  await tray.getByRole("button", { name: "Close dice tray", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open dice tray", exact: true })).toBeFocused();
  await page.reload();
  await expect(page.locator(".dice-history-list > li")).toHaveCount(2);
  await page.keyboard.press("Control+Shift+D");
  await expect(tray).toBeVisible();
  await expect(tray.locator("ol > li")).toHaveCount(2);
  await tray.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByText("No rolls yet.", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tray).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("opens the tray from Play without navigating away", async ({ page }) => {
  await page.goto("/");
  await page.locator(".codex-play-dropdown > summary").click();
  await page.getByRole("button", { name: "Dice tray Open", exact: true }).click();
  const tray = page.getByRole("dialog", { name: "Dice Tray", exact: true });
  await expect(tray).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await tray.getByRole("button", { name: "d2", exact: true }).click();
  await expect(tray.locator("ol > li")).toHaveCount(1);
  const bounds = await tray.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.width + bounds!.x).toBeLessThanOrEqual(page.viewportSize()!.width);
});
