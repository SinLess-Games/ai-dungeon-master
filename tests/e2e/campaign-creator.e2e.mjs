/* global console, URL */
/** Isolated campaign-creator browser and API verification. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
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

const directory = await mkdtemp(join(tmpdir(), "codex-campaign-creator-e2e-"));
const origin = "http://localhost:5189";
const secret = randomBytes(48).toString("hex");
const password = `Campaign-${randomBytes(18).toString("hex")}!`;
let proxy;
let server;
let browser;

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
  await proxy.dispose();
  proxy = undefined;
  console.log("✓ campaign E2E: disposable D1 migrations applied");

  server = await createServer({
    configFile: false,
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "./src/app/routes",
        generatedRouteTree: "./src/routeTree.gen.ts",
      }),
      react(),
      tsconfigPaths(),
      tailwindcss(),
      cloudflare({
        configPath,
        persistState: { path: directory },
        remoteBindings: false,
        inspectorPort: false,
      }),
    ],
    resolve: { dedupe: ["react", "react-dom"] },
    server: { host: "localhost", port: 5189, strictPort: true },
  });
  await server.listen();

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
  page.setDefaultTimeout(15_000);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(origin);
  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await page.getByLabel("Username", { exact: true }).fill("CampaignCreatorE2E");
  await page.getByLabel("Email", { exact: true }).fill("campaign-creator-e2e@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Create Account", exact: true }).click();
  await page.locator(".auth-user-menu summary").waitFor();

  await page.goto(`${origin}/campaigns/new`);
  await page.getByRole("heading", { name: "Your Campaigns" }).waitFor();
  await page.getByRole("button", { name: "Create campaign", exact: true }).first().click();
  await page.getByLabel("Campaign name").fill("Ashes of the North");
  await page.getByLabel("Short description").fill(
    "A frozen kingdom fractures while old powers wake beneath the ice.",
  );
  await page.getByRole("button", { name: /Grimdark/ }).click();
  await page.getByRole("button", { name: /Exploration/ }).click();
  await page.getByRole("button", { name: /Epic/ }).click();
  await page.getByRole("button", { name: /Slow/ }).click();
  await page.getByLabel("Campaign length", { exact: true }).selectOption("long");
  await page.getByLabel("Estimated sessions (optional)", { exact: true }).fill("40");
  await page.getByLabel("Starting level target (optional)", { exact: true }).fill("1");
  await page.getByLabel("Ending level target (optional)", { exact: true }).fill("21");
  await page.getByLabel("Ending target (optional)", { exact: true }).fill("Reunite the northern kingdoms.");
  await page.locator("select").filter({ has: page.locator('option[value="west-marches"]') }).selectOption("west-marches");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByRole("button", { name: /Wild Magic/ }).click();
  await page.getByRole("switch", { name: /Multi-planar world/ }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByRole("button", { name: /Milestone/ }).click();
  await page.getByRole("button", { name: /Gestalt/ }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByRole("button", { name: /Multiplayer/ }).click();
  await page.getByLabel("Maximum players").fill("5");
  await page.getByRole("switch", { name: /Allow spectators/ }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByRole("button", { name: /Brutal/ }).click();
  await page.getByRole("button", { name: /Inventive/ }).click();
  await page.getByRole("switch", { name: /Idle Plus/ }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByRole("button", { name: /Custom/ }).click();
  await page.getByRole("switch", { name: /Allow homebrew/ }).click();
  await page.getByLabel("House rules and table notes").fill("Maximum hit points at first level.");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByRole("heading", { name: "Review Campaign" }).waitFor();
  await page.getByRole("button", { name: "Save campaign", exact: true }).click();
  await page.getByText("Campaign draft ready", { exact: true }).waitFor();

  const campaigns = await api(page, "GET", "/api/campaigns");
  const campaign = campaigns.items.find((entry) => entry.name === "Ashes of the North");
  assert.ok(campaign, "Saved campaign should appear in the campaign list.");
  const detail = await api(page, "GET", `/api/campaigns/${campaign.id}`);
  const settings = detail.campaign.settings;
  assert.equal(settings.creatorVersion, 2);
  assert.deepEqual(settings.duration, {
    length: "long", estimatedSessions: 40, startLevel: 1, endLevel: 21,
    endingTarget: "Reunite the northern kingdoms.",
  });
  assert.deepEqual(settings.genres, ["grimdark", "exploration"]);
  assert.equal(settings.scale, "epic");
  assert.equal(settings.pace, "slow");
  assert.equal(settings.structure, "west-marches");
  assert.equal(settings.world.templateId, "wild-magic");
  assert.equal(settings.world.multiPlanar, true);
  assert.equal(settings.rules.levelingMode, "milestone");
  assert.equal(settings.rules.characterProgression, "gestalt");
  assert.equal(settings.rules.epicLevels, true);
  assert.equal(settings.players.maxPlayers, 5);
  assert.equal(settings.players.allowSpectators, true);
  assert.equal(settings.dm.difficulty, "brutal");
  assert.equal(settings.dm.creativity, "inventive");
  assert.equal(settings.dm.idlePlus, true);
  assert.equal(settings.content.policy, "custom");
  assert.equal(settings.content.allowHomebrew, true);
  assert.equal(settings.ruleset.worldTemplateId, "wild-magic");
  assert.deepEqual(settings.ruleset.campaignStyleIds, ["grimdark", "exploration"]);
  assert.equal(settings.ruleset.multiPlanar, true);
  assert.equal(settings.ruleset.epicLevels, true);
  console.log("✓ campaign E2E: complete seven-stage creator persists its settings");

  await page.getByRole("button", { name: /Back to campaigns/ }).click();
  await page.getByRole("heading", { name: "Your Campaigns" }).waitFor();
  await page.getByRole("heading", { name: "Ashes of the North" }).waitFor();
  await page.getByRole("button", { name: /Continue setup/ }).click();
  await page.getByRole("heading", { name: "Ashes of the North" }).waitFor();
  assert.equal(await page.getByLabel("Campaign length", { exact: true }).inputValue(), "long");
  assert.equal(await page.getByLabel("Estimated sessions (optional)", { exact: true }).inputValue(), "40");
  await page.getByLabel("Campaign length", { exact: true }).selectOption("endless");
  await page.getByLabel("Estimated arc sessions (optional)", { exact: true }).fill("12");
  await page.getByLabel("Short description").fill("The north is breaking, and the old powers are awake.");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByText("Campaign setup updated.").waitFor();
  const resumed = await api(page, "GET", `/api/campaigns/${campaign.id}`);
  assert.equal(
    resumed.campaign.settings.shortDescription,
    "The north is breaking, and the old powers are awake.",
  );
  assert.equal(resumed.campaign.settings.creatorVersion, 2);
  assert.deepEqual(resumed.campaign.settings.duration, { ...settings.duration, length: "endless", estimatedSessions: 12 });
  for (const duration of [
    { length: "invalid" }, { length: "short", estimatedSessions: 0 },
    { length: "short", estimatedSessions: 1.5 }, { length: "long", startLevel: 10, endLevel: 2 },
    { length: "short", endingTarget: "x".repeat(1001) },
  ]) {
    await api(page, "PATCH", `/api/campaigns/${campaign.id}`, { settings: { ...settings, duration } }, 400);
    await api(page, "POST", "/api/campaigns", { name: "Invalid duration", settings: { duration } }, 400);
  }
  const unchanged = await api(page, "GET", `/api/campaigns/${campaign.id}`);
  assert.deepEqual(unchanged.campaign.settings.duration, resumed.campaign.settings.duration);
  console.log("✓ campaign E2E: duration persists through editing and invalid API writes leave it unchanged");
  console.log("✓ campaign E2E: campaign library resumes and updates the same saved draft");

  const tooManyGenres = [
    "grimdark",
    "exploration",
    "survival",
    "mystery",
    "war",
    "urban",
  ];
  const invalid = await page.request.post(`${origin}/api/campaigns`, {
    headers: { Origin: origin },
    data: {
      name: "Invalid Genre Campaign",
      playMode: "solo",
      gameMasterMode: "ai",
      timeMode: "paused",
      visibility: "private",
      maxPlayers: 1,
      settings: {
        ...settings,
        genres: tooManyGenres,
        ruleset: { ...settings.ruleset, campaignStyleIds: tooManyGenres },
      },
    },
  });
  assert.equal(invalid.status(), 400);
  assert.match(await invalid.text(), /no more than 5 campaign styles/i);
  console.log("✓ campaign E2E: server rejects more than five campaign styles");

  const wrongDelete = await page.request.delete(`${origin}/api/campaigns/${campaign.id}`, {
    headers: { Origin: origin },
    data: { confirmationName: "ashes of the north" },
  });
  assert.equal(wrongDelete.status(), 422);
  assert.match(await wrongDelete.text(), /enter the campaign name exactly/i);
  console.log("✓ campaign E2E: server rejects an inexact deletion confirmation");

  await page.getByRole("button", { name: /Back to campaigns/ }).click();
  await page.getByRole("heading", { name: "Your Campaigns" }).waitFor();
  await page.getByRole("button", { name: "Delete Ashes of the North", exact: true }).click();
  const confirmation = page.getByLabel("Campaign name confirmation", { exact: true });
  await confirmation.fill("Wrong campaign name");
  assert.equal(await page.getByRole("button", { name: "Delete campaign", exact: true }).isDisabled(), true);
  await confirmation.fill("Ashes of the North");
  await page.getByRole("button", { name: "Delete campaign", exact: true }).click();
  await page.getByRole("heading", { name: "Ashes of the North" }).waitFor({ state: "detached" });
  const afterDelete = await api(page, "GET", "/api/campaigns");
  assert.equal(afterDelete.items.some((entry) => entry.id === campaign.id), false);
  console.log("✓ campaign E2E: typed-name confirmation deletes the campaign");

  assert.deepEqual(pageErrors, []);
  console.log("\n✓ Campaign creator MVP end-to-end verification passed.");
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  if (proxy) await proxy.dispose();
  await rm(directory, { recursive: true, force: true });
}
