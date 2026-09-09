#!/usr/bin/env node

import { readdir } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const DATABASE_BINDING = "DB";
const SEEDS_ROOT = resolve(process.cwd(), "seeds");

// Keep dependencies deterministic. Entries that do not exist yet are simply skipped.
// Revised 3.5 sources intentionally run before older-edition sources where shared slugs
// should resolve to the revised canonical row instead of creating duplicates.
const preferredSeedOrder = [
  "phb-classes",
  "phb-races",
  "phb-skills",
  "phb-feats",
  "phb-divine",
  "phb-creatures",
  "phb-spells",
  "phb-rules",
  "dmg-rules",
  "phb2-classes",
  "phb2-feats",
  "phb2-spells",
  "phb2-rules",
  "dmg2-rules",
  "spell-compendium-spells",
  "expanded-psionics-handbook-classes",
  "expanded-psionics-handbook-feats",
  "expanded-psionics-handbook-powers",
  "expanded-psionics-handbook-rules",
  "psionics-handbook-classes",
  "psionics-handbook-feats",
  "psionics-handbook-powers",
  "psionics-handbook-rules",
];

function parseArgs(argv) {
  let remote = false;
  const seeds = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--remote") {
      remote = true;
      continue;
    }

    if (arg === "--local") {
      remote = false;
      continue;
    }

    if (arg === "--seed") {
      const seed = argv[index + 1];
      if (!seed || seed.startsWith("--")) {
        throw new Error("--seed requires a seed directory name, for example --seed phb-classes");
      }
      seeds.push(seed);
      index += 1;
      continue;
    }

    if (arg.startsWith("--seed=")) {
      const seed = arg.slice("--seed=".length).trim();
      if (!seed) {
        throw new Error("--seed requires a non-empty seed directory name");
      }
      seeds.push(seed);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { remote, seeds };
}

async function listSeedDirectories() {
  const entries = await readdir(SEEDS_ROOT, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

function orderSeeds(seedNames) {
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

function executeSqlFile(file, remote) {
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  const mode = remote ? "--remote" : "--local";
  const displayPath = relative(process.cwd(), file);

  console.log(`\n→ ${displayPath}`);

  const result = spawnSync(
    executable,
    ["--no-install", "wrangler", "d1", "execute", DATABASE_BINDING, mode, "--file", file],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${displayPath} failed with exit code ${result.status ?? "unknown"}`);
  }
}

async function main() {
  const { remote, seeds: requestedSeeds } = parseArgs(process.argv.slice(2));
  const availableSeeds = await listSeedDirectories();

  const missingSeeds = requestedSeeds.filter((seed) => !availableSeeds.includes(seed));
  if (missingSeeds.length > 0) {
    throw new Error(
      `Unknown seed director${missingSeeds.length === 1 ? "y" : "ies"}: ${missingSeeds.join(", ")}. ` +
        `Available seeds: ${availableSeeds.sort().join(", ")}`,
    );
  }

  const selectedSeeds = orderSeeds(
    requestedSeeds.length > 0 ? [...new Set(requestedSeeds)] : availableSeeds,
  );
  const target = remote ? "REMOTE Cloudflare D1" : "LOCAL D1";

  console.log(`Seeding ${target} through binding ${DATABASE_BINDING}.`);
  console.log(`Seeds: ${selectedSeeds.join(" → ")}`);

  let fileCount = 0;

  for (const seed of selectedSeeds) {
    const seedDirectory = resolve(SEEDS_ROOT, seed);
    const sqlFiles = await listSqlFiles(seedDirectory);

    if (sqlFiles.length === 0) {
      console.log(`\nSkipping ${seed}: no .sql files found.`);
      continue;
    }

    console.log(`\n=== ${seed} (${sqlFiles.length} file${sqlFiles.length === 1 ? "" : "s"}) ===`);

    for (const file of sqlFiles) {
      executeSqlFile(file, remote);
      fileCount += 1;
    }
  }

  console.log(`\n✓ Seeded ${target}: ${fileCount} SQL file${fileCount === 1 ? "" : "s"} applied.`);
}

main().catch((error) => {
  console.error(`\nSeed failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
