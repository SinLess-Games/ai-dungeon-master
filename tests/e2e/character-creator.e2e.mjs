/* global document */
/**
 * Isolated end-to-end verification for the D&D 3.5 character creator backend.
 *
 * This boots the real Vite + Cloudflare Worker monolith, applies every migration
 * to a disposable local D1 database, seeds the creator's authoritative content,
 * authenticates through the real browser UI, and then drives the creator APIs
 * through a complete level-1 Wizard plus targeted class-specific smoke cases.
 */
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
import { getPlatformProxy, unstable_readConfig as readConfig } from "wrangler";

const directory = await mkdtemp(join(tmpdir(), "codex-character-creator-e2e-"));
const origin = "http://localhost:5187";
const secret = randomBytes(48).toString("hex");
const password = `Creator-${randomBytes(18).toString("hex")}!`;
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

async function listSqlFiles(path) {
  const entries = await readdir(path);
  const files = [];
  for (const name of entries.sort((a, b) => a.localeCompare(b))) {
    const child = join(path, name);
    if ((await stat(child)).isDirectory()) files.push(...(await listSqlFiles(child)));
    else if (name.endsWith(".sql")) files.push(child);
  }
  return files;
}

async function applyMigrations(db) {
  for (const file of (await readdir("drizzle")).filter((name) => name.endsWith(".sql")).sort()) {
    const sql = await readFile(join("drizzle", file), "utf8");
    for (const statement of sql
      .split("--> statement-breakpoint")
      .map((value) => value.trim())
      .filter(Boolean)) {
      await db.prepare(statement).run();
    }
  }
}

async function applySeeds(db) {
  for (const seedDirectory of seedDirectories) {
    for (const file of await listSqlFiles(join("seeds", seedDirectory))) {
      await db.exec(await readFile(file, "utf8"));
    }
  }
}

async function scalar(db, sql) {
  return Number((await db.prepare(sql).first())?.n ?? 0);
}

function failResponse(method, path, response, body, expectedStatus) {
  throw new Error(
    `${method} ${path} returned ${response.status()} (expected ${expectedStatus}).\n${body}`,
  );
}

async function requestJson(page, method, path, data, expectedStatus = 200) {
  const response = await page.request.fetch(origin + path, {
    method,
    headers: { Origin: origin },
    ...(data === undefined ? {} : { data }),
  });
  const body = await response.text();
  if (response.status() !== expectedStatus) {
    failResponse(method, path, response, body, expectedStatus);
  }
  if (!body) return null;
  return JSON.parse(body);
}

async function createBaseCharacter(page, input) {
  const suffix = randomBytes(4).toString("hex");
  const campaign = await requestJson(
    page,
    "POST",
    "/api/campaigns",
    {
      name: `${input.name} Campaign ${suffix}`,
      slug: `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${suffix}`,
      playMode: "solo",
      gameMasterMode: "ai",
      timeMode: "paused",
      visibility: "private",
    },
    201,
  );
  const character = await requestJson(
    page,
    "POST",
    `/api/campaigns/${campaign.id}/characters`,
    { name: input.name },
    201,
  );
  await requestJson(page, "PATCH", `/api/characters/${character.id}`, {
    raceId: "phb-race-human",
    alignment: input.alignment ?? "N",
  });
  await requestJson(page, "PUT", `/api/characters/${character.id}/abilities`, {
    str: 10,
    dex: 14,
    con: 14,
    int: input.intelligence ?? 16,
    wis: 12,
    cha: 10,
    ...(input.abilities ?? {}),
  });
  await requestJson(page, "POST", `/api/characters/${character.id}/class-levels`, {
    classLevelId: input.classLevelId,
    hitPointsGained: input.hitPointsGained,
    skillPointsSpent: 0,
    track: 1,
  }, 201);
  return { campaign, character };
}

function allocateExactSkillBudget(skillPage) {
  let remaining = skillPage.budget;
  const selections = [];
  const preferred = skillPage.options.filter(
    (option) =>
      option.isClassSkill &&
      !option.requiresSpecialization &&
      option.slug !== "speak-language",
  );
  for (const option of preferred) {
    if (remaining <= 0) break;
    const maxSpend = option.maximumRanks * option.pointCostPerRank;
    const spend = Math.min(remaining, maxSpend);
    const ranks = spend / option.pointCostPerRank;
    if (ranks <= 0 || !Number.isInteger(ranks)) continue;
    selections.push({ skillId: option.id, ranks });
    remaining -= spend;
  }
  assert.equal(remaining, 0, `Could not allocate the exact ${skillPage.budget}-point skill budget.`);
  return selections;
}

function pickFeat(featPage, slug, used = new Set()) {
  const preferred = featPage.options.find(
    (option) => option.slug === slug && option.choiceKind === "none" && !used.has(option.id),
  );
  const fallback = featPage.options.find(
    (option) =>
      option.choiceKind === "none" &&
      !option.explanation &&
      !used.has(option.id),
  );
  const selected = preferred ?? fallback;
  assert.ok(selected, "Expected an available feat without a creator choice or prerequisite.");
  used.add(selected.id);
  return { featId: selected.id };
}

async function completeWizardCreator(page) {
  const { campaign, character } = await createBaseCharacter(page, {
    name: "E2E Wizard",
    classLevelId: "phb-class-level-wizard-01",
    hitPointsGained: 4,
    intelligence: 16,
  });
  const id = character.id;

  const premature = await page.request.post(`${origin}/api/characters/${id}/ready`, {
    headers: { Origin: origin },
  });
  assert.equal(premature.status(), 400, "The strict ready gate must reject an incomplete creator.");
  assert.match(await premature.text(), /Finish every character-creation step/i);

  const skillPage = await requestJson(page, "GET", `/api/characters/${id}/creation/skills`);
  assert.ok(skillPage.budget > 0);
  await requestJson(page, "PUT", `/api/characters/${id}/skills`, {
    selections: allocateExactSkillBudget(skillPage),
  });

  const languagePage = await requestJson(page, "GET", `/api/characters/${id}/creation/languages`);
  assert.ok(languagePage.automatic.length >= 1);
  assert.ok(languagePage.bonusOptions.length >= languagePage.bonusChoicesRequired);
  await requestJson(page, "PUT", `/api/characters/${id}/languages`, {
    bonusLanguageIds: languagePage.bonusOptions
      .slice(0, languagePage.bonusChoicesRequired)
      .map((language) => language.languageId),
  });

  const featPage = await requestJson(page, "GET", `/api/characters/${id}/creation/feats`);
  assert.equal(featPage.required.level, 1);
  assert.equal(featPage.required.racialBonus, 1);
  const usedFeats = new Set();
  await requestJson(page, "PUT", `/api/characters/${id}/feats`, {
    levelFeats: [pickFeat(featPage, "alertness", usedFeats)],
    racialBonusFeats: [pickFeat(featPage, "improved-initiative", usedFeats)],
    classBonusFeats: [],
  });

  const wealth = await requestJson(
    page,
    "POST",
    `/api/characters/${id}/starting-wealth/roll`,
    undefined,
    201,
  );
  assert.ok(wealth.startingWealthCopper > 0);
  const secondRoll = await requestJson(
    page,
    "POST",
    `/api/characters/${id}/starting-wealth/roll`,
  );
  assert.equal(secondRoll.alreadyRolled, true, "Starting wealth must be roll-once/idempotent.");
  await requestJson(page, "PUT", `/api/characters/${id}/equipment`, { selections: [] });

  await requestJson(page, "PUT", `/api/characters/${id}/class-choices`, {
    wizardSpecialization: null,
  });

  const spellPage = await requestJson(page, "GET", `/api/characters/${id}/creation/spells`);
  assert.equal(spellPage.mode, "spellbook");
  assert.ok(spellPage.automaticSpellIds.length > 0);
  const firstLevelSpells = spellPage.options.filter((spell) => spell.spellLevel === 1);
  assert.ok(firstLevelSpells.length >= spellPage.firstLevelChoicesRequired);
  await requestJson(page, "PUT", `/api/characters/${id}/spells`, {
    ids: firstLevelSpells
      .slice(0, spellPage.firstLevelChoicesRequired)
      .map((spell) => spell.id),
  });

  await requestJson(page, "PUT", `/api/characters/${id}/powers`, { ids: [] });
  await requestJson(page, "PUT", `/api/characters/${id}/divine`, {
    deityId: null,
    domainIds: [],
  });

  const companionPage = await requestJson(page, "GET", `/api/characters/${id}/creation/companions`);
  assert.equal(companionPage.kind, "familiar");
  assert.ok(companionPage.options.includes("Cat"));
  const companion = await requestJson(page, "PUT", `/api/characters/${id}/companions`, {
    creatureName: "Cat",
    name: "Mote",
  });
  assert.equal(companion.selected.creatureName, "Cat");

  const readiness = await requestJson(page, "GET", `/api/characters/${id}/creation/readiness`);
  assert.equal(readiness.complete, true);
  assert.deepEqual(readiness.missing, []);

  const ready = await requestJson(page, "POST", `/api/characters/${id}/ready`);
  assert.equal(ready.status, "ready");
  assert.equal(ready.creationComplete, true);
  assert.ok(ready.maximumHitPoints >= 1);
  assert.equal(ready.campaignStatus, "ready");

  const campaignState = await requestJson(page, "GET", `/api/campaigns/${campaign.id}`);
  assert.equal(campaignState.campaign.status, "ready");
  assert.equal(campaignState.characters.find((entry) => entry.id === id)?.status, "ready");
  console.log("✓ E2E: complete Human Wizard reaches strict ready state");
}

async function smokeWizardSpecialization(page) {
  const { character } = await createBaseCharacter(page, {
    name: "Specialist Wizard",
    classLevelId: "phb-class-level-wizard-01",
    hitPointsGained: 4,
  });
  const id = character.id;
  const choices = await requestJson(page, "GET", `/api/characters/${id}/creation/class-choices`);
  const evocation = choices.schools.find((school) => school.slug === "evocation");
  const enchantment = choices.schools.find((school) => school.slug === "enchantment");
  const necromancy = choices.schools.find((school) => school.slug === "necromancy");
  assert.ok(evocation && enchantment && necromancy);
  await requestJson(page, "PUT", `/api/characters/${id}/class-choices`, {
    wizardSpecialization: {
      schoolId: evocation.id,
      prohibitedSchoolIds: [enchantment.id, necromancy.id],
    },
  });
  const spells = await requestJson(page, "GET", `/api/characters/${id}/creation/spells`);
  assert.ok(spells.options.every((spell) => ![enchantment.id, necromancy.id].includes(spell.schoolId)));
  console.log("✓ smoke: Wizard specialization filters prohibited schools");
}

async function smokeClericDomains(page) {
  const { character } = await createBaseCharacter(page, {
    name: "Domain Cleric",
    classLevelId: "phb-class-level-cleric-01",
    hitPointsGained: 8,
    alignment: "N",
  });
  const id = character.id;
  const divine = await requestJson(page, "GET", `/api/characters/${id}/creation/divine`);
  assert.equal(divine.required, true);
  assert.ok(divine.domainOptions.length >= 2);
  const domainIds = divine.domainOptions.slice(0, 2).map((domain) => domain.id);
  const selected = await requestJson(page, "PUT", `/api/characters/${id}/divine`, {
    deityId: null,
    domainIds,
  });
  assert.deepEqual(new Set(selected.domainIds), new Set(domainIds));
  console.log("✓ smoke: Cleric deity/domain validation persists two domains");
}

async function smokeDruidCompanion(page) {
  const { character } = await createBaseCharacter(page, {
    name: "Companion Druid",
    classLevelId: "phb-class-level-druid-01",
    hitPointsGained: 8,
    alignment: "N",
  });
  const selected = await requestJson(page, "PUT", `/api/characters/${character.id}/companions`, {
    creatureName: "Wolf",
    name: "Briar",
  });
  assert.equal(selected.selected.kind, "animal_companion");
  assert.equal(selected.selected.creatureName, "Wolf");
  console.log("✓ smoke: Druid animal companion persists");
}

async function smokeRangerFavoredEnemy(page) {
  const { character } = await createBaseCharacter(page, {
    name: "Favored Enemy Ranger",
    classLevelId: "phb-class-level-ranger-01",
    hitPointsGained: 8,
  });
  const id = character.id;
  const choices = await requestJson(page, "GET", `/api/characters/${id}/creation/class-choices`);
  assert.ok(choices.options.length >= 15);
  const humanoid = choices.options.find((option) => option.slug === "humanoid");
  const human = choices.subtypeOptions.humanoid.find((option) => option.slug === "human");
  assert.ok(humanoid && human);

  const missingSubtype = await page.request.put(`${origin}/api/characters/${id}/class-choices`, {
    headers: { Origin: origin },
    data: { favoredEnemyTypeId: humanoid.id },
  });
  assert.equal(missingSubtype.status(), 400);

  const selected = await requestJson(page, "PUT", `/api/characters/${id}/class-choices`, {
    favoredEnemyTypeId: humanoid.id,
    favoredEnemySubtypeId: human.id,
  });
  assert.equal(selected.choices[0].parameters.subtypeSlug, "human");
  console.log("✓ smoke: Ranger favored enemy enforces Humanoid/Outsider subtype choice");
}

async function smokePsionPowers(page) {
  const { character } = await createBaseCharacter(page, {
    name: "Discipline Psion",
    classLevelId: "xph-class-level-psion-01",
    hitPointsGained: 4,
  });
  const id = character.id;
  const choices = await requestJson(page, "GET", `/api/characters/${id}/creation/class-choices`);
  assert.equal(choices.choice, "psionic-discipline");
  assert.ok(choices.options.length >= 6);
  const discipline = choices.options[0];
  await requestJson(page, "PUT", `/api/characters/${id}/class-choices`, {
    psionDisciplineId: discipline.id,
  });

  const powers = await requestJson(page, "GET", `/api/characters/${id}/creation/powers`);
  assert.equal(powers.required, true);
  assert.equal(powers.disciplineId, discipline.id);
  assert.ok(powers.options.length >= powers.count);
  const ids = powers.options.slice(0, powers.count).map((power) => power.id);
  const selected = await requestJson(page, "PUT", `/api/characters/${id}/powers`, { ids });
  assert.equal(selected.powerIds.length, powers.count);
  console.log("✓ smoke: Psion discipline constrains and persists powers known");
}

try {
  const original = readConfig({ config: "wrangler.jsonc" });
  const configPath = join(directory, "wrangler.json");
  await writeFile(
    configPath,
    JSON.stringify({
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
    }),
  );

  proxy = await getPlatformProxy({
    configPath,
    persist: { path: join(directory, "v3") },
    remoteBindings: false,
  });
  await applyMigrations(proxy.env.DB);
  await applySeeds(proxy.env.DB);

  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_classes")) >= 15);
  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_skills")) >= 40);
  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_feats")) >= 100);
  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_spells")) >= 100);
  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_powers")) >= 250);
  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_domains")) >= 20);
  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_creature_types")) >= 15);
  console.log("✓ smoke: isolated D1 migrations and creator content seeds are healthy");

  await proxy.dispose();
  proxy = undefined;

  server = await createServer({
    configFile: false,
    resolve: { alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) } },
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "./src/app/routes",
        generatedRouteTree: "./src/routeTree.gen.ts",
      }),
      react(),
      tailwindcss(),
      cloudflare({
        configPath,
        persistState: { path: directory },
        remoteBindings: false,
        inspectorPort: false,
      }),
    ],
    server: { host: "localhost", port: 5187, strictPort: true },
  });
  await server.listen();

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(15_000);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(origin);
  assert.equal((await page.request.get(`${origin}/api/health/live`)).status(), 200);
  assert.equal((await page.request.get(`${origin}/api/health`)).status(), 200);
  assert.equal((await page.request.get(`${origin}/api/campaigns`)).status(), 401);
  console.log("✓ smoke: monolith health and authorization boundaries respond correctly");

  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await page.getByLabel("Username", { exact: true }).fill("CreatorE2E");
  await page.getByLabel("Email", { exact: true }).fill("creator-e2e@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Create Account", exact: true }).click();
  await page.locator(".auth-user-menu summary").waitFor();
  const cookies = await page.context().cookies();
  assert.ok(cookies.some((cookie) => cookie.httpOnly && cookie.name.includes("session_token")));
  console.log("✓ smoke: real browser signup establishes an authenticated creator session");

  await completeWizardCreator(page);
  await smokeWizardSpecialization(page);
  await smokeClericDomains(page);
  await smokeDruidCompanion(page);
  await smokeRangerFavoredEnemy(page);
  await smokePsionPowers(page);

  assert.deepEqual(pageErrors, []);
  console.log("\n✓ Character creator end-to-end and smoke verification passed.");
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  if (proxy) await proxy.dispose();
  await rm(directory, { recursive: true, force: true });
}
