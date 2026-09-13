/* global console, URL, document */
/** Browser-driven regression coverage for character-creator guardrails and library actions. */
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

const directory = await mkdtemp(join(tmpdir(), "codex-creator-guardrails-e2e-"));
const origin = "http://localhost:5189";
const secret = randomBytes(48).toString("hex");
const password = `CreatorGuardrails-${randomBytes(18).toString("hex")}!`;
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
    for (const file of await sqlFiles(join("seeds", seedDirectory))) {
      for (const statement of splitSqlStatements(stripLineComments(await readFile(file, "utf8")))) {
        await db.prepare(statement).run();
      }
    }
  }
}

async function createAccount(page) {
  await page.goto(origin);
  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await page.getByLabel("Username", { exact: true }).fill("CreatorGuardrailsE2E");
  await page.getByLabel("Email", { exact: true }).fill("creator-guardrails-e2e@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Create Account", exact: true }).click();
  await page.locator(".auth-user-menu summary").waitFor();
}

async function openCreator(page, campaignName, characterName) {
  await page.locator("summary.codex-nav-item").filter({ hasText: "Play" }).click();
  await page.getByRole("link", { name: /Characters/ }).click();
  await page.waitForURL(`${origin}/characters`);
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

async function chooseDwarf(page) {
  await page.getByRole("heading", { name: "Choose race and alignment" }).waitFor();
  await page.getByRole("button", { name: /^Dwarf\b/ }).first().click();
  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();
}

async function raisePointBuyScore(card, target) {
  const score = card.locator(".creator-point-score strong");
  const increase = card.locator(".creator-point-score button").nth(1);
  while (Number(await score.textContent()) < target) {
    assert.equal(await increase.isDisabled(), false, `Expected ${target} to remain affordable.`);
    await increase.click();
  }
  assert.equal(Number(await score.textContent()), target);
}

async function verifyAbilityBudgetGuardrail(page) {
  await page.getByRole("heading", { name: "Choose how ability scores are generated" }).waitFor();
  await page.getByRole("button", { name: /^22 point buy/ }).click();

  const strCard = page.locator(".creator-ability-card").filter({ hasText: "STR" });
  const dexCard = page.locator(".creator-ability-card").filter({ hasText: "DEX" });
  await raisePointBuyScore(strCard, 18);
  await raisePointBuyScore(dexCard, 14);

  const budget = (await page.locator(".creator-budget-bar strong").textContent()) ?? "";
  assert.match(budget, /22\s*\/\s*22 spent\s*·\s*0 remaining/);

  const cards = page.locator(".creator-ability-card");
  for (let index = 0; index < await cards.count(); index += 1) {
    const increase = cards.nth(index).locator(".creator-point-score button").nth(1);
    assert.equal(await increase.isDisabled(), true, "No ability may increase after the point-buy budget is exhausted.");
  }

  const continueButton = page.locator(".creator-footer").getByRole("button", { name: /Continue/ });
  assert.equal(await continueButton.isEnabled(), true);
  await continueButton.click();
  console.log("✓ guardrail: point-buy controls stop exactly at the selected ability-point budget");
}

async function beginBarbarian(page) {
  await page.getByRole("heading", { name: "Choose class progression" }).waitFor();
  await page.getByRole("button", { name: /^Barbarian\b/ }).first().click();
  const begin = page.locator(".creator-footer").getByRole("button", { name: "Begin rules-driven creation" });
  assert.equal(await begin.isEnabled(), true);
  await begin.click();
  await page.getByRole("heading", { name: "Resolve first-level class choices" }).waitFor();
}

async function verifyBackToStart(page, characterName) {
  page.once("dialog", async (dialog) => {
    assert.match(dialog.message(), /Going back to the foundation resets the saved draft/i);
    await dialog.accept();
  });
  await page.locator(".creator-steps").getByRole("button", { name: /Identity/ }).click();
  await page.getByRole("heading", { name: "Name the hero" }).waitFor();
  assert.equal(await page.getByLabel("Character name").inputValue(), characterName);

  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("heading", { name: "Choose race and alignment" }).waitFor();
  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("heading", { name: "Choose how ability scores are generated" }).waitFor();
  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();
  await beginBarbarian(page);

  console.log("✓ navigation: a persisted draft can reset all the way back to the first creator step and rebuild");
}

async function verifySkillBudgetGuardrail(page) {
  const saveClassChoices = page.locator(".creator-step-actions").getByRole("button", { name: "Save & continue" });
  assert.equal(await saveClassChoices.isEnabled(), true);
  await saveClassChoices.click();
  await page.getByRole("heading", { name: "Spend skill points" }).waitFor();

  const budgetText = (await page.locator(".creator-budget-bar strong").textContent()) ?? "";
  const budgetMatch = budgetText.match(/([\d.]+)\s*\/\s*([\d.]+)/);
  assert.ok(budgetMatch, `Expected visible skill budget, received: ${budgetText}`);
  const budget = Number(budgetMatch[2]);
  assert.ok(budget > 0);

  const rows = page.locator(".creator-table tbody tr");
  const classSkillInputs = [];
  for (let index = 0; index < await rows.count(); index += 1) {
    const row = rows.nth(index);
    if (await row.locator(".creator-pill.good").count() === 0) continue;
    if (await row.locator(".creator-inline-input").count() > 0) continue;
    classSkillInputs.push(row.locator('input[type="number"]'));
  }
  assert.ok(classSkillInputs.length >= 4, "Expected enough class skills to exercise the remaining-budget clamp.");

  let exhaustedAt = -1;
  for (let index = 0; index < classSkillInputs.length; index += 1) {
    await classSkillInputs[index].fill("999");
    const text = (await page.locator(".creator-budget-bar strong").textContent()) ?? "";
    const match = text.match(/([\d.]+)\s*\/\s*([\d.]+)/);
    assert.ok(match);
    const spent = Number(match[1]);
    assert.ok(spent <= budget, `Skill spending exceeded budget: ${spent} > ${budget}.`);
    if (spent === budget) {
      exhaustedAt = index;
      break;
    }
  }
  assert.ok(exhaustedAt >= 0, "Expected high requested ranks to consume, but never exceed, the skill budget.");

  const nextInput = classSkillInputs[exhaustedAt + 1];
  assert.ok(nextInput, "Expected another skill row after exhausting the budget.");
  await nextInput.fill("999");
  assert.equal(Number(await nextInput.inputValue()), 0, "A skill cannot consume points after the budget is exhausted.");

  const finalBudget = (await page.locator(".creator-budget-bar strong").textContent()) ?? "";
  assert.match(finalBudget, new RegExp(`^${budget}(?:\\.0+)?\\s*\\/\\s*${budget}(?:\\.0+)?`));
  const save = page.locator(".creator-step-actions").getByRole("button", { name: "Save & continue" });
  assert.equal(await save.isEnabled(), true);
  await save.click();
  await page.getByRole("heading", { name: "Choose feats from full rule cards" }).waitFor();

  console.log("✓ guardrail: skill-rank inputs clamp to the remaining skill-point budget");
}

async function verifyLibrarySystemAndDelete(page, characterName) {
  await page.goto(`${origin}/characters`);
  await page.getByRole("heading", { name: "Characters", exact: true }).waitFor();
  const card = page.locator(".character-library-card").filter({ hasText: characterName });
  await card.waitFor();
  const cardText = (await card.textContent()) ?? "";
  assert.match(cardText, /Dungeons & Dragons 3\.5/);
  assert.match(cardText, /System\s*Dungeons & Dragons 3\.5/);

  page.once("dialog", async (dialog) => {
    assert.match(dialog.message(), new RegExp(`Delete ${characterName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\?`));
    await dialog.accept();
  });
  await card.getByRole("button", { name: /Delete character/ }).click();
  await card.waitFor({ state: "detached" });
  assert.equal(await page.locator(".character-library-card").filter({ hasText: characterName }).count(), 0);

  console.log("✓ library: D&D 3.5 system metadata is visible and the character can be permanently deleted");
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
    server: { host: "localhost", port: 5189, strictPort: true },
  });
  await server.listen();

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(15_000);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const suffix = randomBytes(4).toString("hex");
  const campaignName = `Guardrail E2E ${suffix}`;
  const characterName = `Guardrail Barbarian ${suffix}`;

  await createAccount(page);
  await openCreator(page, campaignName, characterName);
  await chooseDwarf(page);
  await verifyAbilityBudgetGuardrail(page);
  await beginBarbarian(page);
  await verifyBackToStart(page, characterName);
  await verifySkillBudgetGuardrail(page);
  await verifyLibrarySystemAndDelete(page, characterName);

  assert.deepEqual(pageErrors, []);
  console.log("\n✓ Character creator guardrail, reset-navigation, system-label, and deletion E2E passed.");
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  if (proxy) await proxy.dispose();
  await rm(directory, { recursive: true, force: true });
}
