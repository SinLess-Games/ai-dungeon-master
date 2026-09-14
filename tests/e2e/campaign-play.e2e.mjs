/* global console, URL */
/** Isolated Campaign Play MVP browser/API verification. */
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

const directory = await mkdtemp(join(tmpdir(), "codex-campaign-play-e2e-"));
const origin = "http://localhost:5190";
const secret = randomBytes(48).toString("hex");
const password = `CampaignPlay-${randomBytes(18).toString("hex")}!`;
const email = "campaign-play-e2e@example.test";
const username = "CampaignPlayE2E";
const characterId = "campaign-play-e2e-character";
let proxy;
let server;
let browser;
let aiServer;

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
    server: { host: "localhost", port: 5190, strictPort: true },
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
    const content = system.includes("private Dungeon Master assistant")
      ? "The rule is clear: resolve uncertain outcomes through the rules engine."
      : "The old stones answer with a low hum. What do you do next?";
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        id: "campaign-play-e2e",
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
        AI_API_KEY: "campaign-play-e2e-key",
        AI_BASE_URL: ai.baseUrl,
        AI_DEVBLOG_MODEL: "campaign-play-e2e-model",
        AI_GAME_MODEL: "campaign-play-e2e-model",
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
  console.log("✓ campaign play E2E: disposable D1 migrations applied");

  server = await startApp(configPath);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
  page.setDefaultTimeout(20_000);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

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
      name: "The Black Glass Road",
      description: "A focused Campaign Play MVP verification world.",
      playMode: "solo",
      gameMasterMode: "ai",
      visibility: "private",
      maxPlayers: 1,
      settings: {},
    },
    201,
  );
  assert.equal(campaign.status, "draft");
  assert.ok(campaign.ownerUserId);

  await server.close();
  server = undefined;

  proxy = await getPlatformProxy({
    configPath,
    persist: { path: join(directory, "v3") },
    remoteBindings: false,
  });
  await proxy.env.DB.prepare(
    `INSERT INTO characters (
       id, campaign_id, owner_user_id, ruleset_id, ruleset_version,
       name, status, metadata, ready_at
     ) VALUES (?, ?, ?, 'dnd35', '3.5', 'Mara Vey', 'ready', '{}', unixepoch())`,
  )
    .bind(characterId, campaign.id, campaign.ownerUserId)
    .run();
  await proxy.env.DB.prepare(
    "UPDATE campaigns SET status = 'ready', ready_at = unixepoch(), updated_at = unixepoch() WHERE id = ?",
  )
    .bind(campaign.id)
    .run();
  await proxy.dispose();
  proxy = undefined;
  console.log("✓ campaign play E2E: rules-ready character attached before start");

  server = await startApp(configPath);

  const started = await api(page, "POST", `/api/campaigns/${campaign.id}/start`);
  assert.equal(started.campaignId, campaign.id);
  assert.equal(started.status, "active");
  assert.ok(started.worldId);

  const startedDetail = await api(page, "GET", `/api/campaigns/${campaign.id}`);
  assert.equal(startedDetail.campaign.status, "active");
  assert.equal(startedDetail.role, "owner");
  assert.equal(startedDetail.characters[0]?.status, "active");
  console.log("✓ campaign play E2E: Start Campaign creates the persistent world and active table");

  await page.goto(`${origin}/campaigns/new`);
  await page.getByRole("heading", { name: "Your Campaigns" }).waitFor();
  await page.getByRole("heading", { name: "The Black Glass Road" }).waitFor();
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await page.getByRole("heading", { name: "The Table", exact: true }).waitFor();
  await page.getByRole("heading", { name: "The Black Glass Road", exact: true }).waitFor();

  const composer = page.getByLabel("Campaign play message");
  await composer.fill("I place my hand against the black standing stone and listen.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByText("I place my hand against the black standing stone and listen.", { exact: true }).waitFor();
  await page.getByText("The old stones answer with a low hum. What do you do next?", { exact: true }).waitFor();
  assert.equal(ai.requests.length, 1);
  console.log("✓ campaign play E2E: Campaign chat persists a player turn and AI DM reply");

  await page.getByRole("button", { name: /OOC · DM/ }).click();
  await composer.fill("OOC: should an uncertain action change HP before a rules check?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByText("OOC: should an uncertain action change HP before a rules check?", { exact: true }).waitFor();
  await page
    .getByText("The rule is clear: resolve uncertain outcomes through the rules engine.", { exact: true })
    .waitFor();
  assert.equal(ai.requests.length, 2);
  await page.getByRole("button", { name: /^Campaign/ }).click();
  assert.equal(
    await page.getByText("OOC: should an uncertain action change HP before a rules check?", { exact: true }).count(),
    0,
  );
  console.log("✓ campaign play E2E: private OOC DM chat is isolated from Campaign chat");

  await page.reload();
  await page.getByRole("heading", { name: "Your Campaigns" }).waitFor();
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await page.getByText("I place my hand against the black standing stone and listen.", { exact: true }).waitFor();
  await page.getByText("The old stones answer with a low hum. What do you do next?", { exact: true }).waitFor();
  console.log("✓ campaign play E2E: campaign conversation survives a full page reload");

  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByText("Campaign play is paused.", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Resume", exact: true }).waitFor();
  const pausedDetail = await api(page, "GET", `/api/campaigns/${campaign.id}`);
  assert.equal(pausedDetail.campaign.status, "paused");

  const pausedState = await api(page, "GET", `/api/campaigns/${campaign.id}/game/state?eventLimit=100`);
  assert.equal(pausedState.campaignId, campaign.id);
  assert.equal(pausedState.worldId, started.worldId);
  assert.ok(pausedState.events.some((event) => event.type === "campaign.started"));

  const blockedAction = await page.request.post(`${origin}/api/campaigns/${campaign.id}/game/commands`, {
    headers: { Origin: origin },
    data: { type: "check.save", actorId: characterId, save: "will", dc: 10 },
  });
  assert.equal(blockedAction.status(), 409, await blockedAction.text());
  console.log("✓ campaign play E2E: pause keeps hydration live while blocking rules-engine mutations");

  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByText("Campaign resumed.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Pause", exact: true }).waitFor();
  const resumedDetail = await api(page, "GET", `/api/campaigns/${campaign.id}`);
  assert.equal(resumedDetail.campaign.status, "active");
  assert.equal(resumedDetail.campaign.worldId, started.worldId);
  console.log("✓ campaign play E2E: resume restores the same persistent campaign runtime");

  assert.deepEqual(pageErrors, []);
  console.log("\n✓ Campaign Play MVP end-to-end verification passed.");
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
  if (proxy) await proxy.dispose();
  if (aiServer) await new Promise((resolve) => aiServer.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
