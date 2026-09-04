import type { BrowserContext, Page } from "@playwright/test";

export const BASE = process.env["E2E_BASE_URL"] ?? "http://localhost:8080";

export function hasSession() {
  return (
    !!process.env["LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"] &&
    !!process.env["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"]
  );
}

/** Restore the injected preview session so authenticated routes render. */
export async function signIn(context: BrowserContext, page: Page) {
  const cookies = process.env["LOVABLE_BROWSER_SUPABASE_COOKIES_JSON"];
  if (cookies) {
    await context.addCookies(
      JSON.parse(cookies).map((c: Record<string, unknown>) => ({ ...c, url: BASE })),
    );
  }
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  const key = process.env["LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"];
  const session = process.env["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"];
  if (key && session) {
    await page.evaluate(
      ([k, s]) => window.localStorage.setItem(k as string, s as string),
      [key, session],
    );
  }
}

export async function goto(page: Page, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
}
