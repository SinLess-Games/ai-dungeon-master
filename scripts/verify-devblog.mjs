/* global document, innerWidth */
/** Runs the real Vite/Worker monolith with isolated D1 and generated, disposable credentials. */
import { createServer } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { getPlatformProxy, unstable_readConfig as readConfig } from "wrangler";
import { chromium } from "@playwright/test";
import { mkdtemp, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
const directory = await mkdtemp(join(tmpdir(), "codex-devblog-browser-"));
const origin = "http://localhost:5187";
const secret = randomBytes(48).toString("hex");
const password = randomBytes(24).toString("hex");
let server, proxy, browser;
try {
  const original = readConfig({ config: "wrangler.jsonc" });
  const configPath = join(directory, "wrangler.json");
  await writeFile(
    configPath,
    JSON.stringify({
      name: original.name,
      main: fileURLToPath(new URL("../src/server/worker.ts", import.meta.url)),
      compatibility_date: original.compatibility_date,
      compatibility_flags: original.compatibility_flags,
      d1_databases: original.d1_databases,
      assets: original.assets,
      r2_buckets: original.r2_buckets,
      vars: { BETTER_AUTH_URL: origin, BETTER_AUTH_SECRET: secret },
    }),
  );
  proxy = await getPlatformProxy({
    configPath,
    persist: { path: join(directory, "v3") },
    remoteBindings: false,
  });
  for (const file of (await readdir("drizzle")).filter((f) => f.endsWith(".sql")).sort())
    for (const statement of (await readFile(`drizzle/${file}`, "utf8"))
      .split("--> statement-breakpoint")
      .filter((s) => s.trim()))
      await proxy.env.DB.prepare(statement).run();
  const loader = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  });
  try {
    const { seedAdmin } = await loader.ssrLoadModule("/src/modules/auth/server/seed.ts");
    await seedAdmin({
      DB: proxy.env.DB,
      BETTER_AUTH_URL: origin,
      BETTER_AUTH_SECRET: secret,
      SEED_ADMIN_PASSWORD: password,
      SEED_ADMIN_EMAIL: "admin-browser@example.test",
      SEED_ADMIN_USERNAME: "BrowserAdmin",
    });
  } finally {
    await loader.close();
  }
  // An older account distinguishes the rolling signup windows.
  await proxy.env.DB.prepare("UPDATE users SET created_at = ? WHERE email = ?")
    .bind(Date.now() - 10 * 86_400_000, "admin-browser@example.test")
    .run();
  await proxy.dispose();
  proxy = undefined;
  server = await createServer({
    configFile: false,
    resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const headers = { Origin: origin };
  await page.goto(origin + "/devblog");
  await page.getByRole("heading", { name: "The Codex Chronicles" }).waitFor();
  assert.equal((await page.request.get(origin + "/api/admin/devblog/posts")).status(), 401);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.getByLabel("Email or username").fill("BrowserAdmin");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Sign In", exact: true }).click();
  await page.locator(".auth-user-menu summary").waitFor();
  await page.goto(origin + "/user/admin");
  await page.getByRole("link", { name: "Devblog studio" }).click();
  await page.getByRole("button", { name: "New post", exact: true }).click();
  await page.getByLabel("Post title").fill("Building Persistent Worlds");
  assert.equal(await page.getByLabel("URL slug").inputValue(), "building-persistent-worlds");
  await page
    .getByLabel("Excerpt", { exact: true })
    .fill("A look at the next chapter of the Endless Codex.");
  await page.getByLabel("Markdown content").fill(`# A lasting world

**Your choices matter.**

<script>alert('unsafe')</script>

| World | State |
| --- | --- |
| Codex | Living |`);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.locator(".blog-preview").getByRole("heading", { name: "A lasting world" }).waitFor();
  assert.equal(await page.locator(".blog-preview script").count(), 0);
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByRole("heading", { name: "Upload an image" }).waitFor();
  const adminList = await (await page.request.get(origin + "/api/admin/devblog/posts")).json();
  const id = adminList.items[0].id;
  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  guestPage.setDefaultTimeout(15000);
  assert.equal(
    (await guest.request.get(origin + "/api/devblog/posts/building-persistent-worlds")).status(),
    404,
  );
  assert.equal((await (await guest.request.get(origin + "/api/devblog/posts")).json()).total, 0);
  const invalidUpload = await page.request.post(
    origin + "/api/admin/devblog/posts/" + id + "/media",
    {
      headers,
      multipart: {
        file: {
          name: "bad.svg",
          mimeType: "image/svg+xml",
          buffer: Buffer.from("<svg onload='alert(1)'/>"),
        },
        alt: "Unsafe",
        width: "1",
        height: "1",
      },
    },
  );
  assert.equal(invalidUpload.status(), 400);
  await page.getByLabel("Image (PNG, JPEG, WebP · up to 5 MB)", { exact: true }).setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: await page.screenshot({ clip: { x: 0, y: 0, width: 150, height: 150 } }),
  });
  await page.getByLabel("Alt text", { exact: true }).fill("The Codex crest");
  await page.getByRole("button", { name: "Upload image", exact: true }).click();
  await page.getByRole("button", { name: "Insert in Markdown" }).waitFor();
  const detail = await (await page.request.get(origin + "/api/admin/devblog/posts/" + id)).json();
  const mediaId = detail.images[0].id;
  assert.equal((await guest.request.get(origin + "/api/devblog/media/" + mediaId)).status(), 401);
  await page.getByRole("button", { name: "Insert in Markdown" }).click();
  await page.getByLabel("Cover image", { exact: true }).selectOption(mediaId);
  await page.getByLabel("Post status", { exact: true }).selectOption("published");
  await page.getByRole("button", { name: "Save and publish", exact: true }).click();
  await page.getByText("Post saved.", { exact: true }).waitFor();
  assert.equal((await guest.request.get(origin + "/api/devblog/media/" + mediaId)).status(), 200);
  const current = (await (await page.request.get(origin + "/api/admin/devblog/posts/" + id)).json())
    .post;
  assert.equal(
    (
      await page.request.put(origin + "/api/admin/devblog/posts/" + id, {
        headers,
        data: { ...current, updatedAt: 0 },
      })
    ).status(),
    409,
  );
  assert.equal(
    (
      await page.request.post(origin + "/api/admin/devblog/posts", {
        headers,
        data: { ...current, coverImageId: null },
      })
    ).status(),
    409,
  );
  assert.equal(
    (
      await page.request.put(origin + "/api/admin/devblog/posts/" + id, {
        headers: { Origin: "https://evil.test" },
        data: current,
      })
    ).status(),
    403,
  );
  await guestPage.goto(origin + "/devblog/building-persistent-worlds");
  await guestPage.getByRole("heading", { name: "Building Persistent Worlds" }).waitFor();
  await guestPage.getByRole("heading", { name: "A lasting world" }).waitFor();
  assert.equal(await guestPage.locator(".blog-markdown script").count(), 0);
  await guestPage.getByLabel("Name", { exact: true }).fill("Guest reader");
  await guestPage
    .getByLabel("Your comment", { exact: true })
    .fill("Excited to see these persistent worlds!");
  await guestPage.getByRole("button", { name: "Submit comment", exact: true }).click();
  await guestPage.getByText("Thanks! Your comment is awaiting review.", { exact: true }).waitFor();
  assert.equal(
    (await (await guest.request.get(origin + "/api/devblog/posts/" + id + "/comments")).json())
      .total,
    0,
  );
  await page.getByRole("button", { name: "← Back to posts" }).click();
  await page.getByRole("button", { name: "Comments", exact: true }).click();
  await page.getByText("Excited to see these persistent worlds!", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await page.getByText("No comments in this queue.").waitFor();
  await guestPage.reload();
  await guestPage
    .locator(".blog-comment")
    .getByText("Excited to see these persistent worlds!", { exact: true })
    .waitFor();
  // Anonymous throttling, approved-only visibility, and authenticated attribution.
  for (let n = 0; n < 4; n++)
    assert.equal(
      (
        await guest.request.post(origin + "/api/devblog/posts/" + id + "/comments", {
          headers,
          data: { authorName: "Guest", body: "Another thoughtful comment " + n },
        })
      ).status(),
      201,
    );
  assert.equal(
    (
      await guest.request.post(origin + "/api/devblog/posts/" + id + "/comments", {
        headers,
        data: { authorName: "Guest", body: "Rate limit test" },
      })
    ).status(),
    429,
  );
  const member = await browser.newContext();
  await member.request.post(origin + "/api/auth/sign-up/email", {
    headers,
    data: {
      name: "Member",
      username: "BlogMember",
      displayUsername: "BlogMember",
      email: "blogmember@example.test",
      password,
    },
  });
  assert.equal((await member.request.get(origin + "/api/admin/devblog/posts")).status(), 403);
  assert.equal(
    (
      await member.request.post(origin + "/api/admin/devblog/posts", { headers, data: current })
    ).status(),
    403,
  );
  assert.equal(
    (
      await member.request.post(origin + "/api/devblog/posts/" + id + "/comments", {
        headers,
        data: { authorName: "Impersonated", body: "Authenticated member comment" },
      })
    ).status(),
    201,
  );
  const pending = await (
    await page.request.get(origin + "/api/admin/devblog/comments?status=pending")
  ).json();
  assert.equal(
    pending.items.find((item) => item.body === "Authenticated member comment").authorName,
    "Member",
  );
  const approved = await (
    await page.request.get(origin + "/api/admin/devblog/comments?status=approved")
  ).json();
  await page.request.put(origin + "/api/admin/devblog/comments/" + approved.items[0].id, {
    headers,
    data: { status: "rejected" },
  });
  assert.equal(
    (await (await guest.request.get(origin + "/api/devblog/posts/" + id + "/comments")).json())
      .total,
    0,
  );
  for (const width of [1440, 390]) {
    await guestPage.setViewportSize({ width, height: 900 });
    await guestPage.screenshot({
      path: join(tmpdir(), "codex-devblog-" + width + ".png"),
      fullPage: true,
    });
    assert.equal(
      await guestPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
  }
  // Archive preserves the record but removes public content, comments, and media.
  assert.equal(
    (
      await page.request.put(origin + "/api/admin/devblog/posts/" + id, {
        headers,
        data: { ...current, status: "archived" },
      })
    ).status(),
    200,
  );
  assert.equal(
    (await guest.request.get(origin + "/api/devblog/posts/building-persistent-worlds")).status(),
    404,
  );
  assert.equal((await guest.request.get(origin + "/api/devblog/media/" + mediaId)).status(), 401);
  assert.equal(
    (await guest.request.get(origin + "/api/devblog/posts/" + id + "/comments")).status(),
    404,
  );
  await member.close();
  await guest.close();
  assert.deepEqual(errors, []);
  console.info(
    "PASS: draft/write/preview, R2 upload, cover and embedded images, publish, slug conflict, concurrent edit, public rendering, anonymous/member comments, moderation, throttling, archive, access controls, and responsive layout.",
  );
} finally {
  await browser?.close();
  await server?.close();
  await proxy?.dispose();
  await rm(directory, { recursive: true, force: true });
}
