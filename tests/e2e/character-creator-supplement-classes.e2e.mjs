/* global console, document, URL */
/** Browser regression coverage for supplemental D&D 3.5 classes in the creator. */
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

const directory = await mkdtemp(join(tmpdir(), "codex-supplement-class-e2e-"));
const origin = "http://localhost:5189";
const secret = randomBytes(48).toString("hex");
const password = `Supplement-${randomBytes(18).toString("hex")}!`;
const seedPaths = [
  "seeds/phb-classes/00-classes.sql",
  "seeds/phb-classes/05-starting-wealth.sql",
  "seeds/phb-races",
  "seeds/phb-skills",
  "seeds/heroes-of-horror-classes/00-classes.sql",
  "seeds/heroes-of-horror-classes/05-starting-wealth.sql",
  "seeds/heroes-of-horror-classes/06-base-prerequisites.sql",
  "seeds/heroes-of-horror-classes/07-skills.sql",
  "seeds/heroes-of-battle-classes/00-classes.sql",
  "seeds/heroes-of-battle-classes/07-skills.sql",
];
let proxy;
let server;
let browser;

async function sqlFiles(path) {
  if (!(await stat(path)).isDirectory()) return [path];
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
  for (const seedPath of seedPaths) {
    for (const file of await sqlFiles(seedPath)) {
      for (const statement of splitSqlStatements(stripLineComments(await readFile(file, "utf8")))) {
        await db.prepare(statement).run();
      }
    }
  }
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

  await page.goto(origin);
  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await page.getByLabel("Username", { exact: true }).fill("SupplementClassE2E");
  await page.getByLabel("Email", { exact: true }).fill("supplement-class-e2e@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Create Account", exact: true }).click();
  await page.locator(".auth-user-menu summary").waitFor();

  const optionResponse = await page.request.get(`${origin}/api/dnd35/character-creation-options`, {
    headers: { Origin: origin },
  });
  assert.equal(optionResponse.status(), 200);
  const options = await optionResponse.json();
  const byName = new Map(options.classes.map((entry) => [entry.name, entry]));

  const archivist = byName.get("Archivist");
  assert.ok(archivist, "Archivist must be returned by the creator options API.");
  assert.equal(archivist.category, "base");
  assert.deepEqual(archivist.startingWealth, { diceCount: 5, dieSides: 4, multiplierGp: 10 });

  const dreadNecromancer = byName.get("Dread Necromancer");
  assert.ok(dreadNecromancer, "Dread Necromancer must be returned by the creator options API.");
  assert.equal(dreadNecromancer.category, "base");
  assert.deepEqual(dreadNecromancer.startingWealth, { diceCount: 3, dieSides: 4, multiplierGp: 10 });
  assert.deepEqual(new Set(dreadNecromancer.allowedAlignments), new Set(["LN", "N", "CN", "LE", "NE", "CE"]));

  for (const prestigeName of ["Combat Medic", "Dread Commando", "Legendary Leader", "War Weaver"]) {
    const prestige = byName.get(prestigeName);
    assert.ok(prestige, `${prestigeName} must be visible in the creator catalog.`);
    assert.equal(prestige.category, "prestige");
    assert.deepEqual(prestige.allowedAlignments, []);
    assert.equal(prestige.startingWealth, null);
    assert.match(prestige.prerequisiteExplanation ?? "", /Prestige class.+not available as a 1st-level class/i);
  }

  await page.goto(`${origin}/characters/new`);
  await page.getByRole("heading", { name: "Forge an adventurer" }).waitFor();
  await page.getByPlaceholder("New campaign name").fill(`Supplement Classes ${randomBytes(4).toString("hex")}`);
  await page.getByPlaceholder("New campaign name").locator("xpath=..").getByRole("button", { name: "Create", exact: true }).click();
  await page.waitForFunction(() => {
    const select = document.querySelector("label.creator-field select");
    return select?.tagName === "SELECT" && typeof select.value === "string" && select.value.length > 0;
  });
  await page.getByLabel("Character name").fill("Supplement Class Browser");
  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();

  await page.getByRole("heading", { name: "Choose race and alignment" }).waitFor();
  await page.getByRole("button", { name: /Dwarf/ }).first().click();
  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("heading", { name: "Choose how ability scores are generated" }).waitFor();
  await page.locator(".creator-footer").getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("heading", { name: "Choose class progression" }).waitFor();

  const begin = page.locator(".creator-footer").getByRole("button", { name: "Begin rules-driven creation" });
  for (const baseName of ["Archivist", "Dread Necromancer"]) {
    const card = page.getByRole("button", { name: new RegExp(`^${baseName}\\b`) }).first();
    await card.waitFor();
    await card.click();
    assert.equal(await begin.isEnabled(), true, `${baseName} must be selectable at level 1.`);
  }

  for (const prestigeName of ["Combat Medic", "Dread Commando", "Legendary Leader", "War Weaver"]) {
    const card = page.getByRole("button", { name: new RegExp(`^${prestigeName}\\b`) }).first();
    await card.waitFor();
    assert.match((await card.textContent()) ?? "", /Prestige class.+not available as a 1st-level class/i);
    await card.click();
    assert.equal(await begin.isEnabled(), false, `${prestigeName} must not be a legal 1st-level selection.`);
  }

  assert.deepEqual(pageErrors, []);
  console.log("✓ supplemental class E2E: HoH base classes are selectable and HoB prestige classes are visible but level-one gated");
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  if (proxy) await proxy.dispose();
  await rm(directory, { recursive: true, force: true });
}
