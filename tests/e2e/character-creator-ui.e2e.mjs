/* global console, URL, document */
/** Browser-driven D&D 3.5 character creator E2E. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { createServer } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { getPlatformProxy, unstable_readConfig as readConfig } from "wrangler";

const directory = await mkdtemp(join(tmpdir(), "codex-creator-ui-e2e-"));
const origin = "http://localhost:5188";
const secret = randomBytes(48).toString("hex");
const password = `CreatorUI-${randomBytes(18).toString("hex")}!`;
const seedDirectories = [
  "phb-classes",
  "phb-races",
  "phb-skills",
  "phb-feats",
  "phb-divine",
  "phb-creatures",
  "phb-spells",
  "expanded-psionics-handbook-classes",
  "expanded-psionics-handbook-feats",
  "expanded-psionics-handbook-powers",
];
let proxy;
let server;
let browser;

async function sqlFiles(path) {
  const files = [];
  for (const name of (await readdir(path)).sort((a, b) => a.localeCompare(b))) {
    const child = join(path, name);
    if ((await stat(child)).isDirectory()) files.push(...(await sqlFiles(child)));
    else if (name.endsWith(".sql")) files.push(child);
  }
  return files;
}

function stripLineComments(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}

function splitSqlStatements(sql) {
  const statements = [];
  let current = "";
  let single = false;
  let double = false;
  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index];
    const next = sql[index + 1];
    if (character === "'" && !double) {
      current += character;
      if (single && next === "'") {
        current += next;
        index += 1;
      } else single = !single;
      continue;
    }
    if (character === '"' && !single) {
      double = !double;
      current += character;
      continue;
    }
    if (character === ";" && !single && !double) {
      if (current.trim()) statements.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  if (current.trim()) statements.push(current.trim());
  assert.equal(single, false, "Seed SQL contains an unterminated single-quoted string.");
  assert.equal(double, false, "Seed SQL contains an unterminated double-quoted identifier.");
  return statements;
}

async function applyMigrations(db) {
  for (const file of (await readdir("drizzle")).filter((name) => name.endsWith(".sql")).sort()) {
    const sql = await readFile(join("drizzle", file), "utf8");
    for (const statement of sql.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) {
      await db.prepare(statement).run();
    }
  }
}

async function applySeeds(db) {
  for (const seedDirectory of seedDirectories) {
    for (const file of await sqlFiles(join("seeds", seedDirectory))) {
      for (const statement of splitSqlStatements(stripLineComments(await readFile(file, "utf8")))) {
        await db.prepare(statement).run();
      }
    }
  }
}

async function saveAndWait(page, nextHeading) {
  const button = page.locator(".creator-step-actions").getByRole("button", { name: "Save & continue" });
  await button.waitFor();
  assert.equal(await button.isEnabled(), true, `Expected Save & continue to be enabled before ${nextHeading}.`);
  await button.click();
  await page.getByRole("heading", { name: nextHeading }).waitFor();
}

async function runUiFlow(page) {
  const campaignName = `UI E2E Campaign ${randomBytes(4).toString("hex")}`;
  const characterName = "UI E2E Barbarian";

  await page.goto(origin);
  await page.locator("summary.codex-nav-item").filter({ hasText: "Play" }).click();
  const characterLink = page.getByRole("link", { name: /Characters/ });
  await characterLink.waitFor();
  assert.match(await characterLink.getAttribute("href") ?? "", /\/characters$/);
  await characterLink.click();
  await page.waitForURL(`${origin}/characters`);
  await page.getByRole("heading", { name: "Characters", exact: true }).waitFor();
  await page.getByRole("link", { name: "Create character", exact: true }).click();
  await page.waitForURL(`${origin}/characters/new`);
  await page.getByRole("heading", { name: "Forge an adventurer" }).waitFor();

  await page.getByPlaceholder("New campaign name").fill(campaignName);
  await page.getByPlaceholder("New campaign name").locator("xpath=..").getByRole("button", { name: "Create", exact: true }).click();
  await page.waitForFunction(() => {
    const select = document.querySelector("label.creator-field select");
    return select?.tagName === "SELECT" && typeof select.value === "string" && select.value.length > 0;
  });
  await page.getByLabel("Character name").fill(characterName);
  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();

  await page.getByRole("heading", { name: "Choose race and alignment" }).waitFor();
  await page.getByRole("button", { name: /Dwarf/ }).first().click();
  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();

  await page.getByRole("heading", { name: "Assign the standard array" }).waitFor();
  const intCard = page.locator(".creator-ability-card").filter({ hasText: "INT" });
  const chaCard = page.locator(".creator-ability-card").filter({ hasText: "CHA" });
  await intCard.locator("select").selectOption("8");
  assert.equal(await intCard.locator("select").inputValue(), "8");
  assert.equal(await chaCard.locator("select").inputValue(), "12", "Used standard-array scores should swap automatically.");
  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();

  await page.getByRole("heading", { name: "Choose a first class" }).waitFor();
  await page.getByRole("button", { name: /Barbarian/ }).first().click();
  const begin = page.locator(".creator-footer").getByRole("button", { name: "Begin rules-driven creation" });
  assert.equal(await begin.isEnabled(), true);
  await begin.click();

  await page.getByRole("heading", { name: "Resolve first-level class choices" }).waitFor();
  await saveAndWait(page, "Spend skill points");

  for (const skillName of ["Climb", "Intimidate", "Survival"]) {
    const row = page.locator("tbody tr").filter({ hasText: skillName }).first();
    await row.locator('input[type="number"]').fill("4");
  }
  assert.match((await page.locator(".creator-budget-bar strong").first().textContent()) ?? "", /12\s*\/\s*12/);
  await saveAndWait(page, "Choose first-level feats");

  const featSelect = page.locator(".creator-slot-card select").first();
  await featSelect.selectOption({ label: "Alertness" });
  await saveAndWait(page, "Choose bonus languages");

  assert.match((await page.locator(".creator-selection-count").textContent()) ?? "", /0\s*\/\s*0/);
  await saveAndWait(page, "Roll starting gold");

  await page.getByRole("button", { name: "Roll starting wealth" }).click();
  const continueEquipment = page.getByRole("button", { name: "Continue to equipment" });
  await continueEquipment.waitFor();
  await continueEquipment.click();
  await page.getByRole("heading", { name: "Purchase starting gear" }).waitFor();

  await saveAndWait(page, "Choose spells or powers");
  await page.getByText("No spell choices", { exact: true }).waitFor();
  await page.getByText("No psionic power choices", { exact: true }).waitFor();
  await saveAndWait(page, "Choose deity and domains");

  await page.getByText("No divine choice required", { exact: true }).waitFor();
  await saveAndWait(page, "Choose a familiar or animal companion");

  await page.getByText("No companion feature", { exact: true }).waitFor();
  await saveAndWait(page, "Ready the adventurer");

  await page.getByText("All creator phases are complete", { exact: true }).waitFor();
  const readyButton = page.getByRole("button", { name: "Mark character ready" });
  assert.equal(await readyButton.isEnabled(), true);
  await readyButton.click();

  await page.getByText("CHARACTER COMPLETE", { exact: true }).waitFor();
  await page.getByRole("heading", { name: characterName }).waitFor();
  assert.match((await page.locator(".creator-complete").textContent()) ?? "", /Level 1 Dwarf Barbarian/);
  assert.match((await page.locator(".creator-complete").textContent()) ?? "", /Ready/);
  assert.match((await page.locator(".creator-character-id").textContent()) ?? "", /Character ID:\s*[0-9a-f-]+/i);

  console.log("✓ UI E2E: Play → Characters opens the library, then the full creator completes a Dwarf Barbarian");
}

try {
  const original = readConfig({ config: "wrangler.jsonc" });
  const configPath = join(directory, "wrangler.json");
  await writeFile(configPath, JSON.stringify({
    name: original.name,
    main: fileURLToPath(new URL("../../src/server/worker.ts", import.meta.url)),
    compatibility_date: original.compatibility_date,
    compatibility_flags: original.compatibility_flags,
    d1_databases: original.d1_databases,
    assets: original.assets,
    vars: {
      BETTER_AUTH_URL: origin,
      BETTER_AUTH_SECRET: secret,
      GITHUB_REPOSITORY: "SinLess-Games/ai-dungeon-master",
    },
  }));

  proxy = await getPlatformProxy({ configPath, persist: { path: join(directory, "v3") }, remoteBindings: false });
  await applyMigrations(proxy.env.DB);
  await applySeeds(proxy.env.DB);
  await proxy.dispose();
  proxy = undefined;

  server = await createServer({
    configFile: false,
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true, routesDirectory: "./src/app/routes", generatedRouteTree: "./src/routeTree.gen.ts" }),
      react(),
      tsconfigPaths(),
      tailwindcss(),
      cloudflare({ configPath, persistState: { path: directory }, remoteBindings: false, inspectorPort: false }),
    ],
    resolve: { dedupe: ["react", "react-dom"] },
    server: { host: "localhost", port: 5188, strictPort: true },
  });
  await server.listen();

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(15_000);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(origin);
  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await page.getByLabel("Username", { exact: true }).fill("CreatorUIE2E");
  await page.getByLabel("Email", { exact: true }).fill("creator-ui-e2e@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Create Account", exact: true }).click();
  await page.locator(".auth-user-menu summary").waitFor();

  await runUiFlow(page);
  assert.deepEqual(pageErrors, []);
  console.log("\n✓ Browser-driven character creator E2E passed.");
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  if (proxy) await proxy.dispose();
  await rm(directory, { recursive: true, force: true });
}
