#!/usr/bin/env node

import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import process from "node:process";
import { createRequire } from "node:module";
import { createInterface } from "node:readline/promises";
import { pathToFileURL } from "node:url";
import { stripVTControlCharacters } from "node:util";

const DATABASE_BINDING = "DB";
const WRANGLER = resolve(
  dirname(createRequire(import.meta.url).resolve("wrangler/package.json")),
  "bin/wrangler.js",
);
// Operator metadata, owned by this runner (like Wrangler's d1_migrations table).
const HISTORY_TABLE = "codex_seed_history";

function parseArgs(argv) {
  let remote = false;
  let yes = false;
  let markApplied = false;
  let migrateLocal = false;
  const seeds = [];
  const systems = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--yes" || arg === "-y") {
      yes = true;
      continue;
    }

    if (arg === "--mark-applied") {
      markApplied = true;
      continue;
    }

    if (arg === "--migrate-local") {
      migrateLocal = true;
      continue;
    }

    if (arg === "--remote") {
      remote = true;
      continue;
    }

    if (arg === "--local") {
      remote = false;
      continue;
    }

    if (arg === "--seed" || arg === "--system") {
      const seed = argv[index + 1];
      if (!seed || seed.startsWith("--")) {
        throw new Error(`${arg} requires a directory name`);
      }
      (arg === "--system" ? systems : seeds).push(seed);
      index += 1;
      continue;
    }

    if (arg.startsWith("--seed=") || arg.startsWith("--system=")) {
      const [flag, ...parts] = arg.split("=");
      const seed = parts.join("=").trim();
      if (!seed) {
        throw new Error(`${flag} requires a non-empty directory name`);
      }
      (flag === "--system" ? systems : seeds).push(seed);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (remote && migrateLocal) {
    throw new Error("--migrate-local cannot be combined with --remote");
  }

  return { remote, seeds, systems, yes, markApplied, migrateLocal };
}

async function listSeedDirectories(seedsRoot) {
  const entries = await readdir(seedsRoot, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

function orderSeeds(seedNames, preferredSeedOrder) {
  const preferredIndex = new Map(preferredSeedOrder.map((name, index) => [name, index]));

  return [...seedNames].sort((a, b) => {
    const aIndex = preferredIndex.get(a);
    const bIndex = preferredIndex.get(b);

    if (aIndex !== undefined && bIndex !== undefined) return aIndex - bIndex;
    if (aIndex !== undefined) return -1;
    if (bIndex !== undefined) return 1;
    return a.localeCompare(b);
  });
}

async function readSeedOrder(systemRoot) {
  let source;
  try {
    source = await readFile(resolve(systemRoot, "seed-order.json"), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const order = JSON.parse(source);
  if (
    !Array.isArray(order) ||
    order.some((name) => typeof name !== "string" || !name || /[\\/]/.test(name)) ||
    new Set(order).size !== order.length
  ) {
    throw new Error(
      `${systemRoot}/seed-order.json must contain an array of unique seed directory names`,
    );
  }
  return order;
}

async function listSqlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listSqlFiles(path)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".sql")) {
      files.push(path);
    }
  }

  return files;
}

function parseWranglerOutput(stdout) {
  // Remote imports can write spinner/progress lines even with --json and CI.
  // Parse the final JSON document, without treating arbitrary log text as data.
  const output = stripVTControlCharacters(stdout).trim();
  const starts = [0, ...Array.from(output.matchAll(/^[ \t]*[[{]/gm), (match) => match.index)];
  for (const start of new Set(starts)) {
    try {
      return JSON.parse(output.slice(start));
    } catch {
      // Try the next line beginning a JSON object or array.
    }
  }
  throw new Error("Wrangler did not return a valid JSON result");
}

export function executeWrangler(args, cwd) {
  const json = args.includes("--json");
  const result = spawnSync(
    process.execPath,
    [WRANGLER, ...args, "--config", resolve(cwd, "wrangler.jsonc")],
    {
      cwd,
      env: { ...process.env, CI: "true" },
      // The runner owns confirmation; children cannot ask additional questions.
      stdio: ["ignore", json ? "pipe" : "inherit", "inherit"],
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    let detail = "";
    if (json && result.stdout) {
      try {
        // Wrangler writes structured failures to stdout in JSON mode, which is
        // otherwise captured and hidden by this wrapper. Report error fields only.
        const failure = parseWranglerOutput(result.stdout).error;
        detail = [failure?.text, ...(failure?.notes ?? []).map((note) => note.text)]
          .filter((value) => typeof value === "string")
          .join(" ");
      } catch {
        // Non-JSON diagnostics still appear on inherited stderr.
      }
    }
    throw new Error(
      `Wrangler failed with exit code ${result.status ?? result.signal ?? "unknown"}${detail ? `: ${detail}` : ""}`,
    );
  }

  if (!json) return [];
  const responses = parseWranglerOutput(result.stdout);
  if (!Array.isArray(responses) || responses.some((response) => response.success !== true)) {
    throw new Error("Wrangler did not confirm successful SQL execution");
  }
  return responses.flatMap((response) => response.results ?? []);
}

async function confirmOnce(question) {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return /^(y|yes)$/i.test((await prompt.question(`${question} [y/N] `)).trim());
  } finally {
    prompt.close();
  }
}

function sqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

export function normalizeD1SeedSql(contents) {
  // Cloudflare D1 rejects CREATE TEMP/TEMPORARY TABLE through the execute API.
  // Seed staging tables are transaction-scoped in practice because their seed
  // files drop them before completion, so execute them as regular tables.
  return contents.replace(/\bCREATE\s+(?:TEMP|TEMPORARY)\s+TABLE\b/giu, "CREATE TABLE");
}

export function buildSeedBatch(contents, path, contentHash) {
  const executableContents = normalizeD1SeedSql(contents);
  // Find the last SQL token, ignoring comments and treating quoted text as one
  // token. Adding an extra ';' after an existing terminator creates an empty
  // statement that remote D1 imports reject (local D1 silently ignores it).
  let lastToken;
  const tokens =
    /--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:""|[^"])*"|`(?:``|[^`])*`|\[[^\]]*\]|\S/g;
  for (const [token] of executableContents.matchAll(tokens)) {
    if (!token.startsWith("--") && !token.startsWith("/*")) lastToken = token;
  }
  const terminator = lastToken && lastToken !== ";" ? ";\n" : "";
  return `${executableContents}\n${terminator}UPDATE ${HISTORY_TABLE} SET status = 'applied', completed_at = CURRENT_TIMESTAMP WHERE path = ${sqlLiteral(path)} AND content_hash = ${sqlLiteral(contentHash)};\n`;
}

export async function main({
  argv = process.argv.slice(2),
  cwd = process.cwd(),
  execute = executeWrangler,
  confirm = confirmOnce,
  log = console.log,
} = {}) {
  const {
    remote,
    seeds: requestedSeeds,
    systems: requestedSystems,
    yes,
    markApplied,
    migrateLocal,
  } = parseArgs(argv);
  const seedsRoot = resolve(cwd, "seeds");
  const availableSystems = await listSeedDirectories(seedsRoot);
  const missingSystems = requestedSystems.filter((system) => !availableSystems.includes(system));
  if (missingSystems.length > 0) {
    throw new Error(
      `Unknown seed system: ${missingSystems.join(", ")}. Available systems: ${availableSystems.sort().join(", ")}`,
    );
  }
  const selectedSystems = [
    ...new Set(requestedSystems.length ? requestedSystems : availableSystems),
  ].sort();
  const availableSeeds = [];
  for (const system of selectedSystems) {
    const systemRoot = resolve(seedsRoot, system);
    const groups = await listSeedDirectories(systemRoot);
    const order = await readSeedOrder(systemRoot);
    availableSeeds.push(...orderSeeds(groups, order).map((group) => `${system}/${group}`));
  }

  const selectedNames = new Set();
  for (const seed of requestedSeeds) {
    const matches = availableSeeds.filter((name) => name === seed || name.split("/")[1] === seed);
    if (matches.length === 0) {
      throw new Error(
        `Unknown seed directory: ${seed}. Available seeds: ${availableSeeds.join(", ")}`,
      );
    }
    if (matches.length > 1) {
      throw new Error(
        `Ambiguous seed directory: ${seed}. Use --system or a qualified --seed: ${matches.join(", ")}`,
      );
    }
    selectedNames.add(matches[0]);
  }

  const selectedSeeds = availableSeeds.filter(
    (seed) => requestedSeeds.length === 0 || selectedNames.has(seed),
  );
  const target = remote ? "REMOTE Cloudflare D1" : "LOCAL D1";
  const files = [];
  for (const seed of selectedSeeds) {
    files.push(...(await listSqlFiles(resolve(seedsRoot, seed))));
  }
  if (files.length === 0) {
    log("No SQL seed files found.");
    return;
  }

  log(`Target: ${target} through binding ${DATABASE_BINDING}.`);
  log(`Seeds: ${selectedSeeds.join(" → ")}`);
  const action = markApplied
    ? "Record the selected files as already applied without executing their SQL?"
    : `${migrateLocal ? "Apply pending local migrations and seed" : "Seed"} ${target}, applying new or changed files?`;
  if (!yes && !(await confirm(action))) {
    log("Seed cancelled.");
    return;
  }

  if (migrateLocal && !markApplied) {
    execute(["d1", "migrations", "apply", DATABASE_BINDING, "--local"], cwd);
  }

  const sql = (command) =>
    execute(
      [
        "d1",
        "execute",
        DATABASE_BINDING,
        remote ? "--remote" : "--local",
        "--yes",
        "--json",
        "--command",
        command,
      ],
      cwd,
    );
  sql(`CREATE TABLE IF NOT EXISTS ${HISTORY_TABLE} (
    path TEXT PRIMARY KEY NOT NULL,
    content_hash TEXT,
    status TEXT NOT NULL CHECK (status IN ('started', 'applied', 'adopted')),
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
  )`);
  const hasContentHash = () =>
    sql(`PRAGMA table_info(${HISTORY_TABLE})`).some((column) => column.name === "content_hash");
  if (!hasContentHash()) {
    try {
      sql(`ALTER TABLE ${HISTORY_TABLE} ADD COLUMN content_hash TEXT`);
    } catch (error) {
      // Another runner may have upgraded the same database concurrently.
      if (!hasContentHash()) throw error;
    }
  }

  // Before system folders existed, all history belonged to D&D 3.5. Rename only
  // selected D&D groups, preserving hashes/status/timestamps. Never move a live
  // claim: an older runner might still be completing it using its original path.
  const legacyGroups = selectedSeeds
    .filter((seed) => seed.startsWith("dnd3-5/"))
    .map((seed) => sqlLiteral(seed.slice("dnd3-5/".length)));
  if (legacyGroups.length > 0) {
    const legacyMatch = `substr(old.path, 1, instr(old.path, '/') - 1) IN (${legacyGroups.join(", ")})`;
    const conflicts = sql(`SELECT old.path FROM ${HISTORY_TABLE} old
      JOIN ${HISTORY_TABLE} current ON current.path = 'dnd3-5/' || old.path
      WHERE ${legacyMatch}`);
    if (conflicts.length > 0) {
      throw new Error(
        `Conflicting legacy and system seed history: ${conflicts.map((row) => row.path).join(", ")}. Reconcile these records before seeding.`,
      );
    }
    sql(`UPDATE ${HISTORY_TABLE} AS old SET path = 'dnd3-5/' || path
      WHERE ${legacyMatch} AND status != 'started'`);
  }
  const history = new Map(
    sql(`SELECT path, status, content_hash FROM ${HISTORY_TABLE}`).map((row) => [row.path, row]),
  );
  const filePath = (file) => relative(seedsRoot, file).replaceAll("\\", "/");
  const unfinished = files.filter((file) => {
    const path = filePath(file);
    return (
      history.get(path)?.status === "started" ||
      (path.startsWith("dnd3-5/") &&
        history.get(path.slice("dnd3-5/".length))?.status === "started")
    );
  });
  if (unfinished.length > 0) {
    throw new Error(
      `Seeds have an unfinished attempt and will not be rerun: ${unfinished.map(filePath).join(", ")}. ` +
        "Inspect their database changes and codex_seed_history before proceeding; see docs/content-seeding.md.",
    );
  }

  let fileCount = 0;
  let skippedCount = 0;
  for (const file of files) {
    const path = filePath(file);
    // Hash the same snapshot that is executed. Normalize line endings so changing
    // operating systems does not replay otherwise unchanged SQL.
    const contents = (await readFile(file, "utf8")).replaceAll("\r\n", "\n");
    const contentHash = createHash("sha256").update(contents).digest("hex");
    const previous = history.get(path);

    if (previous && previous.content_hash === null) {
      // Older history recorded only paths. Preserve completed seeds and establish
      // a baseline without replaying SQL whose original contents were not saved.
      const baselined = sql(`UPDATE ${HISTORY_TABLE} SET content_hash = ${sqlLiteral(contentHash)}
        WHERE path = ${sqlLiteral(path)} AND content_hash IS NULL AND status != 'started'
        RETURNING path`);
      if (baselined.length !== 1) {
        throw new Error(`${path} history changed in another seed run. Run the command again.`);
      }
      log(`Skipping ${path}: recorded current checksum as the baseline for existing history.`);
      skippedCount += 1;
      continue;
    }

    if (previous?.content_hash === contentHash) {
      log(`Skipping ${path}: unchanged.`);
      skippedCount += 1;
      continue;
    }

    // Claim before executing. A crash or uncertain remote response must never
    // cause a second attempt. Compare the previous hash as well as status so
    // concurrent runs cannot both claim a change, even with different snapshots.
    const claimed = sql(`INSERT INTO ${HISTORY_TABLE} (path, content_hash, status, completed_at)
      VALUES (${sqlLiteral(path)}, ${sqlLiteral(contentHash)}, '${markApplied ? "adopted" : "started"}', ${markApplied ? "CURRENT_TIMESTAMP" : "NULL"})
      ON CONFLICT(path) ${
        previous
          ? `DO UPDATE SET content_hash = excluded.content_hash, status = excluded.status, started_at = CURRENT_TIMESTAMP, completed_at = excluded.completed_at
        WHERE ${HISTORY_TABLE}.status != 'started' AND ${HISTORY_TABLE}.content_hash = ${sqlLiteral(previous.content_hash)}`
          : "DO NOTHING"
      }
      RETURNING path`);
    if (claimed.length !== 1) {
      throw new Error(`${path} was claimed by another seed run. Stopping without executing it.`);
    }
    if (!markApplied) {
      log(`\n→ seeds/${path}${previous ? " (updated)" : ""}`);
      let temporaryDirectory;
      try {
        temporaryDirectory = await mkdtemp(resolve(tmpdir(), "codex-seed-"));
        const batchFile = resolve(temporaryDirectory, "seed.sql");
        // Wrangler executes the file in a D1 transaction. Commit completion with
        // the content so a crash/lost response after commit cannot strand history.
        await writeFile(batchFile, buildSeedBatch(contents, path, contentHash));
        execute(
          [
            "d1",
            "execute",
            DATABASE_BINDING,
            remote ? "--remote" : "--local",
            "--yes",
            "--json",
            "--file",
            batchFile,
          ],
          cwd,
        );
      } catch (error) {
        throw new Error(
          `${path}: ${error instanceof Error ? error.message : String(error)}. The attempt remains recorded and will not be retried automatically.`,
        );
      } finally {
        if (temporaryDirectory) {
          await rm(temporaryDirectory, { recursive: true, force: true });
        }
      }
    }
    history.set(path, {
      path,
      content_hash: contentHash,
      status: markApplied ? "adopted" : "applied",
    });
    fileCount += 1;
  }

  log(
    `\n✓ ${target}: ${fileCount} SQL file${fileCount === 1 ? "" : "s"} ${markApplied ? "recorded without execution" : "applied"}, ${skippedCount} skipped.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`\nSeed failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
