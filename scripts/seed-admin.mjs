import {
  getPlatformProxy,
  unstable_readConfig as readConfig,
  unstable_getVarsForDev as getVarsForDev,
} from "wrangler";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const remote = process.argv.includes("--remote");
const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
});
let proxy, temporaryDirectory;
try {
  const config = readConfig({ config: "wrangler.jsonc" });
  const database = config.d1_databases?.find((binding) => binding.binding === "DB");
  if (!database) throw new Error("Required: DB binding");
  const localVars = remote
    ? {}
    : getVarsForDev(resolve("wrangler.jsonc"), undefined, config.vars, undefined, true);
  if (remote) {
    for (const key of ["BETTER_AUTH_URL", "BETTER_AUTH_SECRET", "SEED_ADMIN_PASSWORD"])
      if (!process.env[key]) throw new Error(`Required: ${key}`);
    if (process.env.BETTER_AUTH_URL !== "https://endless-codex.sinlessindustries.com")
      throw new Error("Required: production BETTER_AUTH_URL");
  }
  temporaryDirectory = await mkdtemp(join(tmpdir(), "codex-admin-seed-"));
  const configPath = join(temporaryDirectory, "wrangler.json");
  await writeFile(
    configPath,
    JSON.stringify({
      name: config.name,
      compatibility_date: config.compatibility_date,
      compatibility_flags: config.compatibility_flags,
      d1_databases: [{ ...database, remote }],
    }),
  );
  proxy = await getPlatformProxy({
    configPath,
    remoteBindings: remote,
    persist: remote ? false : { path: resolve(".wrangler/state/v3") },
  });
  const { seedAdmin } = await vite.ssrLoadModule("/src/modules/auth/server/seed.ts");
  const env = {
    ...Object.fromEntries(Object.entries(localVars).map(([key, binding]) => [key, binding.value])),
    DB: proxy.env.DB,
  };
  for (const key of [
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "SEED_ADMIN_EMAIL",
    "SEED_ADMIN_USERNAME",
    "SEED_ADMIN_PASSWORD",
  ])
    if (process.env[key]) env[key] = process.env[key];
  if (!env.SEED_ADMIN_PASSWORD) throw new Error("Required: SEED_ADMIN_PASSWORD");
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32)
    throw new Error("Required: BETTER_AUTH_SECRET_MIN_32_CHARACTERS");
  const result = await seedAdmin(env);
  console.info(
    `Administrator ${result.created ? "created" : "confirmed"} (${remote ? "remote" : "local"} D1): ${result.email} (${result.username}). Existing passwords are preserved.`,
  );
} catch (error) {
  // Only our fixed preflight labels may be shown; SDK errors may contain credential arguments.
  const message =
    error instanceof Error && /^Required: [A-Z_0-9]+$/.test(error.message)
      ? error.message
      : "Check auth/seed environment, migrations, username conflicts, and an existing password credential.";
  console.error(`Admin seed failed. ${message} No default password is used.`);
  process.exitCode = 1;
} finally {
  await proxy?.dispose();
  await vite.close();
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
}
