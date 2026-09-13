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
  "srd-monster-races",
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
    for (const file of await sqlFiles(join("seeds", "dnd3-5", seedDirectory))) {
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

async function assignLowIntelligence(page) {
  const intCard = page.locator(".creator-ability-card").filter({ hasText: "INT" });
  const chaCard = page.locator(".creator-ability-card").filter({ hasText: "CHA" });
  await intCard.locator("select").selectOption("8");
  assert.equal(await intCard.locator("select").inputValue(), "8");
  assert.equal(await chaCard.locator("select").inputValue(), "12", "Used standard-array scores should swap automatically.");
}

async function spendClassSkillBudget(page) {
  const budgetText = (await page.locator(".creator-budget-bar strong").first().textContent()) ?? "";
  const match = budgetText.match(/(\d+)\s*\/\s*(\d+)/);
  assert.ok(match, `Expected a skill budget, received: ${budgetText}`);
  let remaining = Number(match[2]);
  const rows = page.locator(".creator-table tbody tr");
  const count = await rows.count();
  for (let index = 0; index < count && remaining > 0; index += 1) {
    const row = rows.nth(index);
    if (await row.locator(".creator-pill.good").count() === 0) continue;
    if (await row.locator(".creator-inline-input").count() > 0) continue;
    const input = row.locator('input[type="number"]');
    const maximum = Number(await input.getAttribute("max") ?? 0);
    const ranks = Math.min(maximum, remaining);
    if (!Number.isInteger(ranks) || ranks <= 0) continue;
    await input.fill(String(ranks));
    remaining -= ranks;
  }
  assert.equal(remaining, 0, `Unable to spend exact visible class-skill budget ${match[2]}.`);
}

async function startNewCharacter(page, campaignName, characterName) {
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
}

async function runStandardUiFlow(page) {
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
  await startNewCharacter(page, campaignName, characterName);

  await page.getByRole("heading", { name: "Choose race and alignment" }).waitFor();
  const trumpetArchon = page.getByRole("button", { name: /^Trumpet Archon\b/ }).first();
  await trumpetArchon.waitFor();
  const trumpetText = (await trumpetArchon.textContent()) ?? "";
  assert.match(trumpetText, /LA \+8/);
  assert.match(trumpetText, /12d8 racial HD/);
  await page.getByRole("button", { name: /Dwarf/ }).first().click();
  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();

  await page.getByRole("heading", { name: "Choose how ability scores are generated" }).waitFor();
  await assignLowIntelligence(page);
  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();

  await page.getByRole("heading", { name: "Choose class progression" }).waitFor();
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
  await saveAndWait(page, "Choose feats from full rule cards");

  const featSlot = page.locator(".creator-feat-slot").first();
  await featSlot.getByRole("button", { name: /^Alertness\b/ }).click();
  await saveAndWait(page, "Browse the complete language catalog");

  assert.match((await page.locator(".creator-selection-count").textContent()) ?? "", /0\s*\/\s*0/);
  await saveAndWait(page, "Roll class starting wealth");

  await page.getByRole("button", { name: "Roll starting wealth" }).click();
  const continueEquipment = page.getByRole("button", { name: "Continue to equipment" });
  await continueEquipment.waitFor();
  await continueEquipment.click();
  await page.getByRole("heading", { name: "Purchase starting gear" }).waitFor();

  await saveAndWait(page, "Choose spells and powers by class track");
  await page.getByText("No spell choices", { exact: true }).waitFor();
  await page.getByText("No psionic power choices", { exact: true }).waitFor();
  await saveAndWait(page, "Choose deity and domains");

  await page.getByText("No divine choice required", { exact: true }).waitFor();
  await saveAndWait(page, "Choose familiars and animal companions");

  await page.getByText("No companion feature", { exact: true }).waitFor();
  await saveAndWait(page, "Ready the adventurer");

  await page.getByText("All creator phases are complete", { exact: true }).waitFor();
  const readyButton = page.getByRole("button", { name: "Mark character ready" });
  assert.equal(await readyButton.isEnabled(), true);
  await readyButton.click();

  await page.getByText("CHARACTER COMPLETE", { exact: true }).waitFor();
  await page.getByRole("heading", { name: characterName }).waitFor();
  const completeText = (await page.locator(".creator-complete").textContent()) ?? "";
  assert.match(completeText, /Level 1 Dwarf Barbarian/);
  assert.match(completeText, /Standard/);
  assert.ok(completeText.includes(campaignName));

  const libraryLink = page.getByRole("link", { name: "View my characters" });
  await libraryLink.click();
  await page.waitForURL(`${origin}/characters`);
  const savedCard = page.locator(".character-library-card").filter({ hasText: characterName });
  await savedCard.waitFor();
  assert.match((await savedCard.textContent()) ?? "", /Dwarf\s*·\s*Barbarian/);
  assert.match((await savedCard.textContent()) ?? "", /Ready/i);

  console.log("✓ UI E2E: LA +8 is visible and a standard Dwarf Barbarian completes and persists");
}

async function runGestaltCasterFlow(page) {
  const campaignName = `Gestalt UI E2E ${randomBytes(4).toString("hex")}`;
  const characterName = "UI E2E Gestalt Mage";
  await startNewCharacter(page, campaignName, characterName);

  await page.getByRole("heading", { name: "Choose race and alignment" }).waitFor();
  await page.getByRole("button", { name: /Dwarf/ }).first().click();
  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();

  await page.getByRole("heading", { name: "Choose how ability scores are generated" }).waitFor();
  await assignLowIntelligence(page);
  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();

  await page.getByRole("heading", { name: "Choose class progression" }).waitFor();
  await page.getByRole("button", { name: /^Gestalt\b/ }).click();
  const classGrids = page.locator(".creator-class-grid");
  assert.equal(await classGrids.count(), 2);
  await classGrids.nth(0).getByRole("button", { name: /^Wizard\b/ }).click();
  await classGrids.nth(1).getByRole("button", { name: /^Rogue\b/ }).click();
  const begin = page.locator(".creator-footer").getByRole("button", { name: "Begin rules-driven creation" });
  assert.equal(await begin.isEnabled(), true);
  await begin.click();

  await page.getByRole("heading", { name: "Resolve first-level class choices" }).waitFor();
  await page.getByRole("button", { name: "Generalist", exact: true }).waitFor();
  await saveAndWait(page, "Spend skill points");
  await page.getByText("Gestalt class-skill union", { exact: true }).waitFor();
  await spendClassSkillBudget(page);
  await saveAndWait(page, "Choose feats from full rule cards");

  const featSlot = page.locator(".creator-feat-slot").first();
  await featSlot.getByRole("button", { name: /^Alertness\b/ }).click();
  await saveAndWait(page, "Browse the complete language catalog");
  assert.match((await page.locator(".creator-selection-count").textContent()) ?? "", /0\s*\/\s*0/);
  await saveAndWait(page, "Roll class starting wealth");

  await page.getByRole("button", { name: "Roll starting wealth" }).click();
  await page.getByRole("button", { name: "Continue to equipment" }).click();
  await page.getByRole("heading", { name: "Purchase starting gear" }).waitFor();
  await saveAndWait(page, "Choose spells and powers by class track");

  const wizardSpells = page.locator(".creator-track-section").filter({ hasText: "Wizard spells" }).first();
  await wizardSpells.waitFor();
  const note = (await wizardSpells.locator(".creator-track-note").textContent()) ?? "";
  const requiredMatch = note.match(/Choose (\d+) 1st-level spells/);
  assert.ok(requiredMatch, `Expected Wizard spellbook choice count, received: ${note}`);
  const requiredSpells = Number(requiredMatch[1]);
  const spellCards = wizardSpells.locator(".creator-magic-detail-grid button");
  assert.ok(await spellCards.count() >= requiredSpells);
  for (let index = 0; index < requiredSpells; index += 1) await spellCards.nth(index).click();
  await saveAndWait(page, "Choose deity and domains");

  await page.getByText("No divine choice required", { exact: true }).waitFor();
  await saveAndWait(page, "Choose familiars and animal companions");
  const wizardCompanion = page.locator(".creator-track-section").filter({ hasText: "Wizard" }).first();
  await wizardCompanion.getByRole("button", { name: "Cat", exact: true }).click();
  await saveAndWait(page, "Ready the adventurer");

  await page.getByText("All creator phases are complete", { exact: true }).waitFor();
  const readyButton = page.getByRole("button", { name: "Mark character ready" });
  assert.equal(await readyButton.isEnabled(), true);
  await readyButton.click();
  await page.getByText("CHARACTER COMPLETE", { exact: true }).waitFor();
  const completeText = (await page.locator(".creator-complete").textContent()) ?? "";
  assert.match(completeText, /Dwarf Wizard \/\/ Rogue/);
  assert.match(completeText, /Gestalt/);

  await page.getByRole("link", { name: "View my characters" }).click();
  await page.waitForURL(`${origin}/characters`);
  const savedCard = page.locator(".character-library-card").filter({ hasText: characterName });
  await savedCard.waitFor();
  assert.match((await savedCard.textContent()) ?? "", /Wizard \/\/ Rogue/);
  assert.match((await savedCard.textContent()) ?? "", /Gestalt/);
  assert.equal(await page.locator(".character-library-card").count(), 2);

  console.log("✓ UI E2E: gestalt Wizard // Rogue completes spell selection and persists in the character library");
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

  await runStandardUiFlow(page);
  await runGestaltCasterFlow(page);
  assert.deepEqual(pageErrors, []);
  console.log("\n✓ Browser-driven standard, high-LA visibility, gestalt, caster, and character-library E2E passed.");
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  if (proxy) await proxy.dispose();
  await rm(directory, { recursive: true, force: true });
}
