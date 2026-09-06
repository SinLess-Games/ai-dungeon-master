/** Isolated local D1 integration check. Never reads production credentials or persists test accounts. */
import { getPlatformProxy } from "wrangler";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { readFile, readdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
});
let proxy;
try {
  proxy = await getPlatformProxy({
    configPath: "wrangler.jsonc",
    persist: false,
    remoteBindings: false,
  });
  const env = {
    DB: proxy.env.DB,
    BETTER_AUTH_URL: "http://localhost:5173",
    BETTER_AUTH_SECRET: randomBytes(48).toString("hex"),
    SEED_ADMIN_PASSWORD: randomBytes(24).toString("hex"),
    SEED_ADMIN_EMAIL: "seed@example.test",
    SEED_ADMIN_USERNAME: "SeedAdmin",
    GOOGLE_CLIENT_ID: "test-google",
    GOOGLE_CLIENT_SECRET: "test-google-secret",
    DISCORD_CLIENT_ID: "test-discord",
    DISCORD_CLIENT_SECRET: "test-discord-secret",
  };
  for (const file of (await readdir("drizzle")).filter((f) => f.endsWith(".sql")).sort()) {
    const sql = await readFile(`drizzle/${file}`, "utf8");
    for (const statement of sql.split("--> statement-breakpoint").filter((s) => s.trim()))
      await env.DB.prepare(statement).run();
  }
  const { createAuth } = await vite.ssrLoadModule("/src/modules/auth/server/auth.ts");
  const { seedAdmin } = await vite.ssrLoadModule("/src/modules/auth/server/seed.ts");
  const { app } = await vite.ssrLoadModule("/src/server/app.ts");
  const auth = createAuth(env);
  const request = (path, body, cookie) =>
    app.request(
      `http://localhost:5173${path}`,
      {
        method: body ? "POST" : "GET",
        headers: {
          origin: "http://localhost:5173",
          "content-type": "application/json",
          ...(cookie ? { cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
      env,
    );
  const cookies = (response) =>
    response.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
  assert.equal((await request("/api/health")).status, 200);
  assert.equal(await (await request("/api/auth/get-session")).json(), null);
  assert.equal((await request("/api/me")).status, 401);
  const password = randomBytes(16).toString("hex");
  const attack = await request("/api/auth/sign-up/email", {
    name: "Intruder",
    username: "Intruder",
    email: "intruder@example.test",
    password,
    role: "admin",
  });
  assert.equal(attack.status, 400);
  const signup = await request("/api/auth/sign-up/email", {
    name: "Hero",
    username: " Hero_Test ",
    displayUsername: "Hero_Test",
    email: "hero@example.test",
    password,
  });
  assert.equal(signup.status, 200, `Signup failed: ${await signup.clone().text()}`);
  const signedUp = await signup.json();
  assert.equal(signedUp.user.role, "user");
  assert.equal(signedUp.user.username, "hero_test");
  assert.equal(signedUp.user.displayUsername, "Hero_Test");
  const cookie = cookies(signup);
  assert.match(signup.headers.get("set-cookie"), /HttpOnly/i);
  assert.equal((await request("/api/me", undefined, cookie)).status, 200);
  assert.equal((await request("/api/admin/access", undefined, cookie)).status, 403);
  assert.equal(
    (
      await request(
        "/api/auth/admin/create-user",
        { email: "intruder@example.test", name: "Intruder", password, role: "admin" },
        cookie,
      )
    ).status,
    403,
  );
  const duplicate = await request("/api/auth/sign-up/email", {
    name: "Other",
    username: "HERO_TEST",
    email: "other@example.test",
    password,
  });
  assert.ok(duplicate.status >= 400);
  await env.DB.prepare("DELETE FROM rate_limits").run();
  const missing = await request("/api/auth/sign-up/email", {
    name: "Missing",
    email: "missing@example.test",
    password,
  });
  assert.equal(missing.status, 400);
  const forged = await app.request(
    "http://localhost:5173/api/auth/sign-up/email",
    {
      method: "POST",
      headers: { origin: "https://evil.example", "content-type": "application/json" },
      body: JSON.stringify({
        name: "Other",
        username: "OtherHero",
        email: "other@example.test",
        password,
      }),
    },
    env,
  );
  assert.equal(forged.status, 403);
  await request("/api/auth/sign-out", {}, cookie);
  assert.equal(await (await request("/api/auth/get-session", undefined, cookie)).json(), null);
  for (const [path, identity] of [
    ["email", { email: "hero@example.test" }],
    ["username", { username: "HERO_TEST" }],
  ]) {
    const response = await request(`/api/auth/sign-in/${path}`, { ...identity, password });
    assert.equal(response.status, 200);
  }
  await seedAdmin(env);
  await seedAdmin(env);
  assert.equal(
    (
      await env.DB.prepare("SELECT count(*) AS n FROM users WHERE email = ?")
        .bind(env.SEED_ADMIN_EMAIL)
        .first()
    ).n,
    1,
  );
  assert.equal(
    (
      await env.DB.prepare(
        "SELECT count(*) AS n FROM accounts JOIN users ON users.id=accounts.user_id WHERE users.email = ?",
      )
        .bind(env.SEED_ADMIN_EMAIL)
        .first()
    ).n,
    1,
  );
  const adminLogin = await request("/api/auth/sign-in/username", {
    username: "SeedAdmin",
    password: env.SEED_ADMIN_PASSWORD,
  });
  assert.equal(adminLogin.status, 200);
  assert.equal((await request("/api/admin/access", undefined, cookies(adminLogin))).status, 200);
  for (const provider of ["google", "discord"]) {
    const response = await request("/api/auth/sign-in/social", {
      provider,
      callbackURL: "/",
      disableRedirect: true,
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    const redirect = new URL(result.url);
    assert.equal(
      redirect.searchParams.get("redirect_uri"),
      `http://localhost:5173/api/auth/callback/${provider}`,
    );
  }
  assert.ok(await auth.api.getSession({ headers: new Headers({ cookie: cookies(adminLogin) }) }));
  console.info(
    "PASS: D1 signup, normalized usernames, duplicate rejection, session/logout, email/username login, CSRF, user/admin guards, privilege escalation rejection, idempotent seed, OAuth redirect initiation.",
  );
} finally {
  await proxy?.dispose();
  await vite.close();
}
