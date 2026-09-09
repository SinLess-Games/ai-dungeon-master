/* global console, URL */
/** Real isolated D&D 3.5 character-creator end-to-end + smoke verification. */
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

const directory = await mkdtemp(join(tmpdir(), "codex-creator-e2e-"));
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

async function scalar(db, sql) {
  return Number((await db.prepare(sql).first())?.n ?? 0);
}

async function api(page, method, path, data, status = 200) {
  const response = await page.request.fetch(origin + path, {
    method,
    headers: { Origin: origin },
    ...(data === undefined ? {} : { data }),
  });
  const text = await response.text();
  assert.equal(response.status(), status, `${method} ${path}: ${response.status()} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function baseCharacter(page, { name, classLevelId, hitPointsGained, alignment = "N" }) {
  const suffix = randomBytes(4).toString("hex");
  const campaign = await api(page, "POST", "/api/campaigns", {
    name: `${name} Campaign ${suffix}`,
    slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${suffix}`,
    playMode: "solo",
    gameMasterMode: "ai",
    timeMode: "paused",
    visibility: "private",
  }, 201);
  const character = await api(page, "POST", `/api/campaigns/${campaign.id}/characters`, { name }, 201);
  await api(page, "PATCH", `/api/characters/${character.id}`, {
    raceId: "phb-race-human",
    alignment,
  });
  await api(page, "PUT", `/api/characters/${character.id}/abilities`, {
    str: 10,
    dex: 14,
    con: 14,
    int: 16,
    wis: 12,
    cha: 10,
  });
  await api(page, "POST", `/api/characters/${character.id}/class-levels`, {
    classLevelId,
    hitPointsGained,
    skillPointsSpent: 0,
    track: 1,
  }, 201);
  return { campaign, character };
}

function exactSkills(skillPage) {
  let remaining = skillPage.budget;
  const selections = [];
  for (const option of skillPage.options.filter((candidate) =>
    candidate.isClassSkill && !candidate.requiresSpecialization && candidate.slug !== "speak-language")) {
    if (remaining === 0) break;
    const ranks = Math.min(option.maximumRanks, remaining);
    if (!Number.isInteger(ranks) || ranks <= 0) continue;
    selections.push({ skillId: option.id, ranks });
    remaining -= ranks;
  }
  assert.equal(remaining, 0, `Unable to spend exact skill budget ${skillPage.budget}.`);
  return selections;
}

function simpleFeat(featPage, preferredSlug, used) {
  const feat = featPage.options.find((option) =>
    option.slug === preferredSlug && option.choiceKind === "none" && !used.has(option.id)) ??
    featPage.options.find((option) =>
      option.choiceKind === "none" && !option.explanation && !used.has(option.id));
  assert.ok(feat, "Expected a selectable no-choice feat.");
  used.add(feat.id);
  return { featId: feat.id };
}

async function wizardEndToEnd(page) {
  const { campaign, character } = await baseCharacter(page, {
    name: "E2E Wizard",
    classLevelId: "phb-class-level-wizard-01",
    hitPointsGained: 4,
  });
  const id = character.id;
  const early = await page.request.post(`${origin}/api/characters/${id}/ready`, { headers: { Origin: origin } });
  assert.equal(early.status(), 422);
  assert.match(await early.text(), /Finish every character-creation step/i);

  const skills = await api(page, "GET", `/api/characters/${id}/creation/skills`);
  await api(page, "PUT", `/api/characters/${id}/skills`, { selections: exactSkills(skills) });

  const languages = await api(page, "GET", `/api/characters/${id}/creation/languages`);
  assert.ok(languages.automatic.length > 0);
  assert.ok(languages.bonusOptions.length >= languages.bonusChoicesRequired);
  await api(page, "PUT", `/api/characters/${id}/languages`, {
    bonusLanguageIds: languages.bonusOptions.slice(0, languages.bonusChoicesRequired).map((entry) => entry.languageId),
  });

  const feats = await api(page, "GET", `/api/characters/${id}/creation/feats`);
  assert.equal(feats.required.level, 1);
  assert.equal(feats.required.racialBonus, 1);
  const used = new Set();
  await api(page, "PUT", `/api/characters/${id}/feats`, {
    levelFeats: [simpleFeat(feats, "alertness", used)],
    racialBonusFeats: [simpleFeat(feats, "improved-initiative", used)],
    classBonusFeats: [],
  });

  const wealth = await api(page, "POST", `/api/characters/${id}/starting-wealth/roll`, undefined, 201);
  assert.ok(wealth.startingWealthCopper > 0);
  assert.equal((await api(page, "POST", `/api/characters/${id}/starting-wealth/roll`)).alreadyRolled, true);
  await api(page, "PUT", `/api/characters/${id}/equipment`, { selections: [] });

  await api(page, "PUT", `/api/characters/${id}/class-choices`, { wizardSpecialization: null });
  const spells = await api(page, "GET", `/api/characters/${id}/creation/spells`);
  assert.equal(spells.mode, "spellbook");
  assert.ok(spells.automaticSpellIds.length > 0);
  const levelOne = spells.options.filter((spell) => spell.spellLevel === 1);
  assert.ok(levelOne.length >= spells.firstLevelChoicesRequired);
  await api(page, "PUT", `/api/characters/${id}/spells`, {
    ids: levelOne.slice(0, spells.firstLevelChoicesRequired).map((spell) => spell.id),
  });

  await api(page, "PUT", `/api/characters/${id}/powers`, { ids: [] });
  await api(page, "PUT", `/api/characters/${id}/divine`, { deityId: null, domainIds: [] });
  const companion = await api(page, "PUT", `/api/characters/${id}/companions`, { creatureName: "Cat", name: "Mote" });
  assert.equal(companion.selected.creatureName, "Cat");

  const readiness = await api(page, "GET", `/api/characters/${id}/creation/readiness`);
  assert.equal(readiness.complete, true);
  assert.deepEqual(readiness.missing, []);
  const ready = await api(page, "POST", `/api/characters/${id}/ready`);
  assert.equal(ready.status, "ready");
  assert.equal(ready.creationComplete, true);
  assert.equal(ready.campaignStatus, "ready");
  assert.ok(ready.maximumHitPoints > 0);
  const persisted = await api(page, "GET", `/api/campaigns/${campaign.id}`);
  assert.equal(persisted.campaign.status, "ready");
  assert.equal(persisted.characters.find((entry) => entry.id === id)?.status, "ready");
  console.log("✓ E2E: Human Wizard completes every creator phase and becomes ready");
}

async function wizardSpecializationSmoke(page) {
  const { character } = await baseCharacter(page, { name: "Specialist Wizard", classLevelId: "phb-class-level-wizard-01", hitPointsGained: 4 });
  const id = character.id;
  const choices = await api(page, "GET", `/api/characters/${id}/creation/class-choices`);
  const evocation = choices.schools.find((school) => school.slug === "evocation");
  const enchantment = choices.schools.find((school) => school.slug === "enchantment");
  const necromancy = choices.schools.find((school) => school.slug === "necromancy");
  assert.ok(evocation && enchantment && necromancy);
  await api(page, "PUT", `/api/characters/${id}/class-choices`, {
    wizardSpecialization: { schoolId: evocation.id, prohibitedSchoolIds: [enchantment.id, necromancy.id] },
  });
  const spells = await api(page, "GET", `/api/characters/${id}/creation/spells`);
  assert.ok(spells.options.every((spell) => ![enchantment.id, necromancy.id].includes(spell.schoolId)));
  console.log("✓ smoke: Wizard specialist excludes prohibited schools");
}

async function clericDomainSmoke(page) {
  const { character } = await baseCharacter(page, { name: "Domain Cleric", classLevelId: "phb-class-level-cleric-01", hitPointsGained: 8 });
  const id = character.id;
  const divine = await api(page, "GET", `/api/characters/${id}/creation/divine`);
  assert.equal(divine.required, true);
  const domainIds = divine.domainOptions.slice(0, 2).map((domain) => domain.id);
  assert.equal(domainIds.length, 2);
  const selected = await api(page, "PUT", `/api/characters/${id}/divine`, { deityId: null, domainIds });
  assert.deepEqual(new Set(selected.domainIds), new Set(domainIds));
  console.log("✓ smoke: Cleric domains validate and persist");
}

async function druidCompanionSmoke(page) {
  const { character } = await baseCharacter(page, { name: "Companion Druid", classLevelId: "phb-class-level-druid-01", hitPointsGained: 8 });
  const selected = await api(page, "PUT", `/api/characters/${character.id}/companions`, { creatureName: "Wolf", name: "Briar" });
  assert.equal(selected.selected.kind, "animal_companion");
  assert.equal(selected.selected.creatureName, "Wolf");
  console.log("✓ smoke: Druid animal companion validates and persists");
}

async function rangerFavoredEnemySmoke(page) {
  const { character } = await baseCharacter(page, { name: "Favored Enemy Ranger", classLevelId: "phb-class-level-ranger-01", hitPointsGained: 8 });
  const id = character.id;
  const choices = await api(page, "GET", `/api/characters/${id}/creation/class-choices`);
  const humanoid = choices.options.find((option) => option.slug === "humanoid");
  const human = choices.subtypeOptions.humanoid.find((option) => option.slug === "human");
  assert.ok(humanoid && human);
  const missingSubtype = await page.request.put(`${origin}/api/characters/${id}/class-choices`, {
    headers: { Origin: origin },
    data: { favoredEnemyTypeId: humanoid.id },
  });
  assert.equal(missingSubtype.status(), 400);
  const selected = await api(page, "PUT", `/api/characters/${id}/class-choices`, {
    favoredEnemyTypeId: humanoid.id,
    favoredEnemySubtypeId: human.id,
  });
  assert.equal(selected.choices[0].parameters.subtypeSlug, "human");
  console.log("✓ smoke: Ranger favored enemy subtype is enforced and persisted");
}

async function psionPowerSmoke(page) {
  const { character } = await baseCharacter(page, { name: "Discipline Psion", classLevelId: "xph-class-level-psion-01", hitPointsGained: 4 });
  const id = character.id;
  const choices = await api(page, "GET", `/api/characters/${id}/creation/class-choices`);
  assert.equal(choices.choice, "psionic-discipline");
  assert.ok(choices.options.length >= 6);
  const discipline = choices.options[0];
  await api(page, "PUT", `/api/characters/${id}/class-choices`, { psionDisciplineId: discipline.id });
  const powers = await api(page, "GET", `/api/characters/${id}/creation/powers`);
  assert.equal(powers.required, true);
  assert.equal(powers.disciplineId, discipline.id);
  assert.ok(powers.options.length >= powers.count);
  const selected = await api(page, "PUT", `/api/characters/${id}/powers`, {
    ids: powers.options.slice(0, powers.count).map((power) => power.id),
  });
  assert.equal(selected.powerIds.length, powers.count);
  console.log("✓ smoke: Psion discipline constrains and persists powers known");
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
  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_classes")) >= 15);
  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_skills")) >= 40);
  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_feats")) > 0);
  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_spells")) > 0);
  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_powers")) > 0);
  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_domains")) >= 20);
  assert.ok((await scalar(proxy.env.DB, "SELECT count(*) AS n FROM dnd35_creature_types")) >= 15);
  console.log("✓ smoke: disposable D1 migrations and creator seeds load correctly");
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
  console.log("✓ smoke: health and auth boundaries respond correctly");

  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await page.getByLabel("Username", { exact: true }).fill("CreatorE2E");
  await page.getByLabel("Email", { exact: true }).fill("creator-e2e@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Create Account", exact: true }).click();
  await page.locator(".auth-user-menu summary").waitFor();
  assert.ok((await page.context().cookies()).some((cookie) => cookie.httpOnly && cookie.name.includes("session_token")));
  console.log("✓ smoke: browser signup creates an authenticated creator session");

  await wizardEndToEnd(page);
  await wizardSpecializationSmoke(page);
  await clericDomainSmoke(page);
  await druidCompanionSmoke(page);
  await rangerFavoredEnemySmoke(page);
  await psionPowerSmoke(page);
  assert.deepEqual(pageErrors, []);
  console.log("\n✓ Character creator end-to-end and smoke verification passed.");
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  if (proxy) await proxy.dispose();
  await rm(directory, { recursive: true, force: true });
}
