/* global console, URL */
/** End-to-end verification for the structured AI DM state-tool loop. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createServer as createHttpServer } from "node:http";
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

const directory = await mkdtemp(join(tmpdir(), "codex-ai-dm-tools-e2e-"));
const origin = "http://localhost:5191";
const secret = randomBytes(48).toString("hex");
const password = `AiDmTools-${randomBytes(18).toString("hex")}!`;
const email = "ai-dm-tools-e2e@example.test";
const username = "AiDmToolsE2E";
const characterId = "ai-dm-tools-e2e-character";
const sourceId = "ai-dm-tools-e2e-source";
const conditionId = "ai-dm-tools-e2e-blessed";
const itemId = "ai-dm-tools-e2e-potion";
const skillId = "ai-dm-tools-e2e-search";
const persistPath = join(directory, "v3");

let proxy;
let server;
let browser;
let aiServer;
let actorId = null;
let plannerStep = 0;
let alignmentCalls = 0;

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

async function startApp(configPath) {
  const instance = await createServer({
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
    server: { host: "localhost", port: 5191, strictPort: true },
  });
  await instance.listen();
  return instance;
}

async function startAiMock() {
  const requests = [];
  const instance = createHttpServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/v1/chat/completions") {
      response.writeHead(404).end();
      return;
    }

    let raw = "";
    for await (const chunk of request) raw += chunk;
    const body = JSON.parse(raw);
    requests.push(body);
    const system = body.messages?.find((entry) => entry.role === "system")?.content ?? "";
    const prompt = body.messages?.find((entry) => entry.role === "user")?.content ?? "";

    let content;
    if (system.includes("Dungeon Master turn planner")) {
      assert.ok(actorId, "Planner was called before the runtime character actor was known.");
      plannerStep += 1;
      if (plannerStep === 1) {
        content = JSON.stringify({
          kind: "command",
          command: {
            type: "condition.apply",
            targetId: actorId,
            conditionRef: "test-blessed",
            durationKind: "special",
            reason: "The shrine's blessing settles over the character.",
          },
        });
      } else if (plannerStep === 2) {
        content = JSON.stringify({
          kind: "command",
          command: {
            type: "inventory.grant",
            itemRef: "test-potion",
            quantity: 2,
            reason: "The shrine reveals two healing draughts.",
          },
        });
      } else if (plannerStep === 3) {
        content = JSON.stringify({
          kind: "command",
          command: {
            type: "progression.xp.grant",
            amount: 250,
            reason: "The character completed the shrine trial.",
          },
        });
      } else if (plannerStep === 4) {
        content = JSON.stringify({
          kind: "narration",
          text: "The shrine falls quiet as its gifts settle into your keeping.",
        });
      } else if (plannerStep === 5) {
        content = JSON.stringify({
          kind: "check",
          preface: "The inner runes are tightly interlocked. Give me a Search check.",
          check: {
            type: "check.skill",
            skillId,
            dc: 12,
            reason: "Find the hidden latch behind the shrine's inner runes.",
          },
        });
      } else if (plannerStep === 6) {
        content = JSON.stringify({
          kind: "check",
          preface: "You find the seam, but the release is concealed. Make one more Search check.",
          check: {
            type: "check.skill",
            skillId,
            dc: 14,
            reason: "Locate the concealed release without disturbing the ward.",
          },
        });
      } else if (plannerStep === 7) {
        const inventoryMatch = prompt.match(
          /"inventoryId":"([^"]+)","itemId":"ai-dm-tools-e2e-potion"/,
        );
        assert.ok(inventoryMatch, "Expected the planner tool context to expose the granted potion stack.");
        content = JSON.stringify({
          kind: "command",
          command: {
            type: "inventory.remove",
            inventoryId: inventoryMatch[1],
            quantity: 1,
            reason: "One draught is consumed to safely neutralize the revealed ward.",
          },
        });
      } else {
        content = JSON.stringify({
          kind: "narration",
          text: "The hidden release clicks free, and the ward fades without a flash.",
        });
      }
    } else if (system.includes("ongoing alignment drift")) {
      alignmentCalls += 1;
      content = JSON.stringify({
        record: true,
        lawChaosDelta: 0,
        goodEvilDelta: 6,
        reason: "The character completed the shrine trial to protect travelers on the road.",
      });
    } else {
      content = "The shrine falls quiet.";
    }

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        id: "ai-dm-state-tools-e2e",
        object: "chat.completion",
        choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
      }),
    );
  });

  await new Promise((resolve, reject) => {
    instance.once("error", reject);
    instance.listen(0, "127.0.0.1", () => resolve());
  });
  const address = instance.address();
  assert.ok(address && typeof address === "object");
  return { instance, requests, baseUrl: `http://127.0.0.1:${address.port}/v1` };
}

async function one(db, sql, ...bindings) {
  return db.prepare(sql).bind(...bindings).first();
}

try {
  const ai = await startAiMock();
  aiServer = ai.instance;

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
        AI_API_KEY: "ai-dm-state-tools-e2e-key",
        AI_BASE_URL: ai.baseUrl,
        AI_DEVBLOG_MODEL: "ai-dm-state-tools-e2e-model",
        AI_GAME_MODEL: "ai-dm-state-tools-e2e-model",
      },
    }),
  );

  proxy = await getPlatformProxy({
    configPath,
    persist: { path: persistPath },
    remoteBindings: false,
  });
  await applyMigrations(proxy.env.DB);
  await proxy.dispose();
  proxy = undefined;
  console.log("✓ AI DM tools E2E: disposable D1 migrations applied");

  server = await startApp(configPath);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(20_000);

  await page.goto(origin);
  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Create Account", exact: true }).click();
  await page.locator(".auth-user-menu summary").waitFor();

  const campaign = await api(
    page,
    "POST",
    "/api/campaigns",
    {
      name: "The Shrine at Black Glass Road",
      description: "Structured AI DM state-tool verification.",
      playMode: "solo",
      gameMasterMode: "ai",
      visibility: "private",
      maxPlayers: 1,
      settings: {},
    },
    201,
  );

  await server.close();
  server = undefined;

  proxy = await getPlatformProxy({
    configPath,
    persist: { path: persistPath },
    remoteBindings: false,
  });
  await proxy.env.DB.prepare(
    `INSERT INTO characters (
       id, campaign_id, owner_user_id, ruleset_id, ruleset_version,
       name, status, metadata, ready_at
     ) VALUES (?, ?, ?, 'dnd35', '3.5', 'Ari Vale', 'ready', '{}', unixepoch())`,
  )
    .bind(characterId, campaign.id, campaign.ownerUserId)
    .run();
  await proxy.env.DB.prepare(
    `INSERT INTO dnd35_characters (character_id, current_hit_points, alignment)
     VALUES (?, 10, 'N')`,
  )
    .bind(characterId)
    .run();
  await proxy.env.DB.prepare(
    `INSERT INTO dnd35_sources (id, slug, name)
     VALUES (?, 'ai-dm-tools-e2e', 'AI DM Tools E2E')`,
  )
    .bind(sourceId)
    .run();
  await proxy.env.DB.prepare(
    `INSERT INTO dnd35_conditions (id, source_id, slug, name)
     VALUES (?, ?, 'test-blessed', 'Test Blessed')`,
  )
    .bind(conditionId, sourceId)
    .run();
  await proxy.env.DB.prepare(
    `INSERT INTO dnd35_items (id, source_id, slug, name, category, price_copper, weight_pounds)
     VALUES (?, ?, 'test-potion', 'Test Potion', 'consumable', 5000, 0.1)`,
  )
    .bind(itemId, sourceId)
    .run();
  await proxy.env.DB.prepare(
    `INSERT INTO dnd35_skills (
       id, source_id, slug, name, ability, trained_only, armor_check_multiplier, requires_specialization
     ) VALUES (?, ?, 'test-search', 'Test Search', 'int', 0, 0, 0)`,
  )
    .bind(skillId, sourceId)
    .run();
  await proxy.env.DB.prepare(
    `INSERT INTO dnd35_character_ability_scores (character_id, ability, base_score)
     VALUES (?, 'int', 14)`,
  )
    .bind(characterId)
    .run();
  await proxy.env.DB.prepare(
    `INSERT INTO dnd35_character_skills (character_id, skill_id, specialization, ranks)
     VALUES (?, ?, '', 4)`,
  )
    .bind(characterId, skillId)
    .run();
  await proxy.env.DB.prepare(
    "UPDATE campaigns SET status = 'ready', ready_at = unixepoch(), updated_at = unixepoch() WHERE id = ?",
  )
    .bind(campaign.id)
    .run();
  await proxy.dispose();
  proxy = undefined;
  console.log("✓ AI DM tools E2E: structured character and catalog fixtures created");

  server = await startApp(configPath);
  const started = await api(page, "POST", `/api/campaigns/${campaign.id}/start`);
  assert.equal(started.status, "active");

  const initialState = await api(page, "GET", `/api/campaigns/${campaign.id}/game/state?eventLimit=100`);
  const characterActor = initialState.actors.find((entry) => entry.characterId === characterId);
  assert.ok(characterActor, "Expected the started campaign to expose the character actor.");
  actorId = characterActor.id;

  const result = await api(
    page,
    "POST",
    `/api/campaigns/${campaign.id}/play/messages`,
    {
      channel: "campaign",
      characterId,
      content: "I complete the shrine trial and accept the blessing meant to protect travelers.",
    },
    201,
  );

  assert.equal(result.aiError, null);
  assert.equal(result.pendingAction, null);
  assert.equal(
    result.dmMessage?.content,
    "The shrine falls quiet as its gifts settle into your keeping.",
  );
  assert.equal(plannerStep, 4);
  assert.equal(alignmentCalls, 1);
  assert.ok(ai.requests.length >= 5, "Expected planner calls plus alignment adjudication.");
  console.log("✓ AI DM tools E2E: bounded planner executed three authoritative commands then narrated");

  const checkRequest = await api(
    page,
    "POST",
    `/api/campaigns/${campaign.id}/play/messages`,
    {
      channel: "campaign",
      characterId,
      content: "I study the shrine's inner runes and search for the hidden release.",
    },
    201,
  );
  assert.equal(checkRequest.aiError, null);
  assert.equal(checkRequest.pendingAction?.kind, "check.skill");
  assert.equal(checkRequest.pendingAction?.skill?.name, "Test Search");
  assert.equal(checkRequest.pendingAction?.dc, 12);
  assert.equal(plannerStep, 5);

  const blocked = await api(
    page,
    "POST",
    `/api/campaigns/${campaign.id}/play/messages`,
    {
      channel: "campaign",
      characterId,
      content: "I try to act again before resolving the requested roll.",
    },
    409,
  );
  assert.ok(blocked, "Expected an outstanding DM check to block another in-character action.");
  assert.equal(plannerStep, 5);
  console.log("✓ AI DM tools E2E: outstanding player roll blocks additional in-character actions");

  const firstResolution = await api(
    page,
    "POST",
    `/api/campaigns/${campaign.id}/play/dm-actions/${checkRequest.pendingAction.id}/resolve`,
    { roll: 10 },
  );
  assert.equal(firstResolution.result.type, "check.skill");
  assert.equal(firstResolution.pendingAction?.kind, "check.skill");
  assert.equal(firstResolution.pendingAction?.dc, 14);
  assert.equal(firstResolution.aiError, null);
  assert.equal(plannerStep, 6);
  console.log("✓ AI DM tools E2E: first authoritative check can chain a second requested roll");

  const secondResolution = await api(
    page,
    "POST",
    `/api/campaigns/${campaign.id}/play/dm-actions/${firstResolution.pendingAction.id}/resolve`,
    { roll: 12 },
  );
  assert.equal(secondResolution.result.type, "check.skill");
  assert.equal(secondResolution.pendingAction, null);
  assert.equal(secondResolution.aiError, null);
  assert.equal(
    secondResolution.dmMessage?.content,
    "The hidden release clicks free, and the ward fades without a flash.",
  );
  assert.equal(plannerStep, 8);
  assert.equal(alignmentCalls, 2);
  console.log("✓ AI DM tools E2E: resolved checks re-enter the tool loop and continue authoritative state changes");

  const state = await api(page, "GET", `/api/campaigns/${campaign.id}/game/state?eventLimit=100`);
  const eventTypes = state.events.map((event) => event.type);
  assert.ok(eventTypes.includes("condition.applied"));
  assert.ok(eventTypes.includes("inventory.item.granted"));
  assert.ok(eventTypes.includes("inventory.item.removed"));
  assert.ok(eventTypes.includes("progression.xp.granted"));
  assert.equal(eventTypes.filter((type) => type === "check.skill").length, 2);
  assert.equal(eventTypes.filter((type) => type === "alignment.drift").length, 2);
  console.log("✓ AI DM tools E2E: authoritative events are visible in the campaign read model");

  await server.close();
  server = undefined;

  proxy = await getPlatformProxy({
    configPath,
    persist: { path: persistPath },
    remoteBindings: false,
  });
  const condition = await one(
    proxy.env.DB,
    `SELECT condition_id AS conditionId, actor_id AS actorId
     FROM runtime_dnd35_actor_conditions
     WHERE actor_id = ? AND condition_id = ?`,
    actorId,
    conditionId,
  );
  assert.deepEqual(condition, { conditionId, actorId });

  const inventory = await one(
    proxy.env.DB,
    `SELECT item_id AS itemId, quantity, location
     FROM dnd35_character_inventory
     WHERE character_id = ? AND item_id = ?`,
    characterId,
    itemId,
  );
  assert.deepEqual(inventory, { itemId, quantity: 1, location: "carried" });

  const character = await one(
    proxy.env.DB,
    `SELECT experience_points AS experiencePoints, alignment
     FROM dnd35_characters
     WHERE character_id = ?`,
    characterId,
  );
  assert.deepEqual(character, { experiencePoints: 250, alignment: "N" });

  const alignment = await one(
    proxy.env.DB,
    `SELECT law_chaos_score AS lawChaosScore,
            good_evil_score AS goodEvilScore,
            last_reason AS lastReason
     FROM runtime_dnd35_alignment_states
     WHERE character_id = ?`,
    characterId,
  );
  assert.equal(alignment.lawChaosScore, 0);
  assert.equal(alignment.goodEvilScore, 12);
  assert.match(alignment.lastReason, /protect travelers/i);
  console.log("✓ AI DM tools E2E: condition, inventory, XP, checks, and alignment state persisted in D1");

  console.log("\n✓ Structured AI DM state-tool end-to-end verification passed.");
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  if (proxy) await proxy.dispose();
  if (aiServer) await new Promise((resolve) => aiServer.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
