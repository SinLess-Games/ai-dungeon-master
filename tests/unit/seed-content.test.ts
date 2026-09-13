import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeWrangler, main } from "../../scripts/seed-content.mjs";

vi.mock("node:child_process", () => ({ spawnSync: vi.fn() }));

let cwd: string;
let database: DatabaseSync;
let filesExecuted: string[];

function seed(path: string, sql: string, system = "dnd3-5") {
  const file = join(cwd, "seeds", system, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, sql);
}

function execute(args: string[]) {
  if (args.includes("migrations")) return [];
  expect(args).toContain("--yes");
  expect(args).toContain("--json");
  const fileIndex = args.indexOf("--file");
  if (fileIndex !== -1) {
    const file = args[fileIndex + 1]!;
    filesExecuted.push(file);
    // Match Wrangler's local D1 batch transaction semantics.
    database.exec("BEGIN");
    try {
      database.exec(readFileSync(file, "utf8"));
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
    return [];
  }
  const command = args[args.indexOf("--command") + 1]!;
  return database.prepare(command).all();
}

const confirm = vi.fn(async () => true);
const log = vi.fn();
function run(argv: string[] = [], transport = execute) {
  return main({ cwd, argv, execute: transport, confirm, log });
}

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "codex-seed-test-"));
  database = new DatabaseSync(join(cwd, "test.sqlite"));
  database.exec("CREATE TABLE events (name TEXT NOT NULL)");
  filesExecuted = [];
  confirm.mockResolvedValue(true);
  seed("phb-classes/00-first.sql", "INSERT INTO events VALUES ('first')");
  seed("phb-races/00-second.sql", "INSERT INTO events VALUES ('second')");
});

afterEach(() => {
  database.close();
  rmSync(cwd, { recursive: true, force: true });
});

describe("content seeding", () => {
  it("migrates checksummed D&D history after the directory move without replaying SQL", async () => {
    await run(["--yes", "--seed=phb-classes"]);
    const previous = database.prepare("SELECT * FROM codex_seed_history").get()!;
    database.exec("UPDATE codex_seed_history SET path = 'phb-classes/00-first.sql'");
    await run(["--yes", "--seed=dnd3-5/phb-classes"]);
    expect(filesExecuted).toHaveLength(1);
    expect(database.prepare("SELECT * FROM codex_seed_history").get()).toEqual(previous);
    expect(previous.path).toBe("dnd3-5/phb-classes/00-first.sql");
    expect(previous.content_hash).toBe(
      createHash("sha256").update("INSERT INTO events VALUES ('first')").digest("hex"),
    );
    seed("phb-classes/00-first.sql", "INSERT INTO events VALUES ('changed after move')");
    await run(["--yes", "--system=dnd3-5", "--seed=phb-classes"]);
    expect(filesExecuted).toHaveLength(2);
  });

  it("discovers other systems and keeps matching group names independent", async () => {
    seed("phb-classes/00-first.sql", "INSERT INTO events VALUES ('other system')", "other");
    await run(["--yes", "--system=other", "--seed=phb-classes"]);
    expect(database.prepare("SELECT path FROM codex_seed_history").all()).toEqual([
      { path: "other/phb-classes/00-first.sql" },
    ]);
    await run(["--yes"]);
    await run(["--yes", "--system", "other", "--system=dnd3-5"]);
    expect(filesExecuted).toHaveLength(3);
    expect(database.prepare("SELECT COUNT(*) AS count FROM codex_seed_history").get()?.count).toBe(
      3,
    );
  });

  it("rejects ambiguous names and invalid systems before prompting", async () => {
    seed("phb-classes/00-first.sql", "SELECT 1", "other");
    await expect(run(["--seed=phb-classes"])).rejects.toThrow("Ambiguous seed directory");
    await expect(run(["--system=missing"])).rejects.toThrow("Unknown seed system");
    await expect(run(["--system=../other"])).rejects.toThrow("Unknown seed system");
    await expect(run(["--system=other", "--seed=dnd3-5/phb-classes"])).rejects.toThrow(
      "Unknown seed directory",
    );
    expect(confirm).not.toHaveBeenCalled();
    await run(["--yes", "--seed=other/phb-classes"]);
    expect(filesExecuted).toHaveLength(1);
  });

  it("uses each system's manifest for dependencies and alphabetizes remaining groups", async () => {
    seed("z-parent/00.sql", "CREATE TABLE dependency (value TEXT)", "other");
    seed("a-child/00.sql", "INSERT INTO dependency VALUES ('child')", "other");
    seed("c-extra/00.sql", "INSERT INTO dependency VALUES ('extra')", "other");
    writeFileSync(
      join(cwd, "seeds", "other", "seed-order.json"),
      JSON.stringify(["z-parent", "a-child", "future-group"]),
    );
    await run(["--yes", "--system=other"]);
    expect(database.prepare("SELECT value FROM dependency").all()).toEqual([
      { value: "child" },
      { value: "extra" },
    ]);
    expect(filesExecuted).toHaveLength(3);
  });

  it("rejects malformed seed order without any database changes", async () => {
    writeFileSync(join(cwd, "seeds", "dnd3-5", "seed-order.json"), '["phb-classes","phb-classes"]');
    const transport = vi.fn(execute);
    await expect(run([], transport)).rejects.toThrow("unique seed directory names");
    expect(transport).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it("preserves both records when legacy and qualified history collide", async () => {
    await run(["--yes", "--seed=phb-classes"]);
    database.exec(`INSERT INTO codex_seed_history (path, status, content_hash)
      SELECT 'phb-classes/00-first.sql', status, content_hash FROM codex_seed_history`);
    await expect(run(["--yes", "--seed=phb-classes"])).rejects.toThrow(
      "Conflicting legacy and system seed history",
    );
    expect(database.prepare("SELECT COUNT(*) AS count FROM codex_seed_history").get()?.count).toBe(
      2,
    );
    expect(filesExecuted).toHaveLength(1);
  });

  it("confirms once, persists history, and only applies new or changed files", async () => {
    const transport = vi.fn(execute);
    await run(["--local", "--migrate-local"], transport);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0]?.[0]).toContain("migrations");
    expect(database.prepare("SELECT name FROM events").all()).toEqual([
      { name: "first" },
      { name: "second" },
    ]);

    database.close();
    database = new DatabaseSync(join(cwd, "test.sqlite"));
    seed("phb-classes/00-first.sql", "INSERT INTO events VALUES ('edited')");
    seed("phb-classes/01-new.sql", "INSERT INTO events VALUES ('new')");
    await run(["--yes"]);
    await run(["--yes"]);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(filesExecuted).toHaveLength(4);
    expect(filesExecuted.every((file) => !existsSync(file))).toBe(true);
    expect(database.prepare("SELECT name FROM events").all()).toEqual([
      { name: "first" },
      { name: "second" },
      { name: "edited" },
      { name: "new" },
    ]);
  });

  it("applies edited upserts and skips unchanged content regardless of line endings", async () => {
    seed(
      "phb-classes/00-first.sql",
      "CREATE TABLE settings (id TEXT PRIMARY KEY, value TEXT);\nINSERT INTO settings VALUES ('test', 'old') ON CONFLICT(id) DO UPDATE SET value=excluded.value;",
    );
    await run(["--yes", "--seed=phb-classes"]);
    const updated =
      "CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, value TEXT);\nINSERT INTO settings VALUES ('test', 'updated') ON CONFLICT(id) DO UPDATE SET value=excluded.value;";
    seed("phb-classes/00-first.sql", updated);
    await run(["--yes", "--seed=phb-classes"]);
    seed("phb-classes/00-first.sql", updated.replaceAll("\n", "\r\n"));
    await run(["--yes", "--seed=phb-classes"]);
    expect(filesExecuted).toHaveLength(2);
    expect(database.prepare("SELECT * FROM settings").all()).toEqual([
      { id: "test", value: "updated" },
    ]);
    expect(
      database.prepare("SELECT content_hash FROM codex_seed_history").get()?.content_hash,
    ).toMatch(/^[a-f0-9]{64}$/);
  });

  it("upgrades path-only history without replaying seeds, then detects subsequent edits", async () => {
    database.exec(`CREATE TABLE codex_seed_history (
      path TEXT PRIMARY KEY NOT NULL, status TEXT NOT NULL,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT);
      INSERT INTO codex_seed_history (path, status, completed_at)
      VALUES ('phb-classes/00-first.sql', 'applied', '2026-09-01 00:00:00');`);
    await run(["--yes", "--seed=phb-classes"]);
    expect(filesExecuted).toHaveLength(0);
    expect(
      database.prepare("SELECT completed_at FROM codex_seed_history").get()?.completed_at,
    ).toBe("2026-09-01 00:00:00");
    seed("phb-classes/00-first.sql", "INSERT INTO events VALUES ('upgrade')");
    await run(["--yes", "--seed=phb-classes"]);
    await run(["--yes", "--seed=phb-classes"]);
    expect(filesExecuted).toHaveLength(1);
    expect(database.prepare("SELECT name FROM events").all()).toEqual([{ name: "upgrade" }]);
  });

  it("keeps legacy unfinished attempts blocked when upgrading history", async () => {
    database.exec(`CREATE TABLE codex_seed_history (
      path TEXT PRIMARY KEY NOT NULL, status TEXT NOT NULL,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT);
      INSERT INTO codex_seed_history (path, status) VALUES ('phb-classes/00-first.sql', 'started');`);
    await expect(run(["--yes"])).rejects.toThrow("unfinished attempt");
    expect(filesExecuted).toHaveLength(0);
    expect(
      database.prepare("SELECT content_hash FROM codex_seed_history").get()?.content_hash,
    ).toBeNull();
  });

  it("allows adoption of the current checksum and applies a later edit", async () => {
    await run(["--yes", "--mark-applied", "--seed=phb-classes"]);
    seed("phb-classes/00-first.sql", "INSERT INTO events VALUES ('after adoption')");
    await run(["--yes", "--seed=phb-classes"]);
    await run(["--yes", "--seed=phb-classes"]);
    expect(filesExecuted).toHaveLength(1);
  });

  it("performs no database operations or migrations when declined", async () => {
    confirm.mockResolvedValue(false);
    const transport = vi.fn(execute);
    await run(["--migrate-local"], transport);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(transport).not.toHaveBeenCalled();
  });

  it("does not rerun failed attempts or continue into dependent seeds", async () => {
    seed("phb-classes/00-first.sql", "INSERT INTO events VALUES ('partial'); INVALID SQL;");
    await expect(run()).rejects.toThrow("will not be retried automatically");
    await expect(run(["--yes"])).rejects.toThrow("unfinished attempt");
    expect(filesExecuted).toHaveLength(1);
    expect(database.prepare("SELECT name FROM events").all()).toEqual([]);
    expect(filesExecuted.every((file) => !existsSync(file))).toBe(true);
  });

  it("resumes without rerunning committed SQL after losing the execution response", async () => {
    const transport = (args: string[]) => {
      const result = execute(args);
      if (args.includes("--file")) {
        throw new Error("Connection lost");
      }
      return result;
    };
    await expect(run(["--seed=phb-classes"], transport)).rejects.toThrow("Connection lost");
    await run(["--yes", "--seed=phb-classes"]);
    expect(filesExecuted).toHaveLength(1);
    expect(database.prepare("SELECT name FROM events").all()).toEqual([{ name: "first" }]);
    expect(database.prepare("SELECT status FROM codex_seed_history").get()).toEqual({
      status: "applied",
    });
  });

  it("rolls back content if its completion record cannot commit", async () => {
    const transport = (args: string[]) => {
      if (args.includes("--file")) {
        database.exec(`CREATE TRIGGER reject_completion BEFORE UPDATE ON codex_seed_history
          BEGIN SELECT RAISE(ABORT, 'completion failed'); END`);
      }
      return execute(args);
    };
    await expect(run([], transport)).rejects.toThrow("completion failed");
    expect(database.prepare("SELECT name FROM events").all()).toEqual([]);
    expect(database.prepare("SELECT status FROM codex_seed_history").get()).toEqual({
      status: "started",
    });
  });

  it("uses a unique database claim to stop a concurrent runner before SQL execution", async () => {
    const transport = (args: string[]) => {
      const command = args[args.indexOf("--command") + 1];
      if (command?.startsWith("INSERT INTO codex_seed_history")) {
        execute(args); // A competing process obtains the claim after our history read.
      }
      return execute(args);
    };
    await expect(run([], transport)).rejects.toThrow("claimed by another seed run");
    expect(filesExecuted).toHaveLength(0);
  });

  it("prevents concurrent claims of an update even when the competing run finishes first", async () => {
    await run(["--yes", "--seed=phb-classes"]);
    seed("phb-classes/00-first.sql", "INSERT INTO events VALUES ('updated')");
    const transport = (args: string[]) => {
      const command = args[args.indexOf("--command") + 1];
      if (command?.startsWith("INSERT INTO codex_seed_history")) {
        execute(args);
        database.exec("UPDATE codex_seed_history SET status = 'applied'");
      }
      return execute(args);
    };
    await expect(run(["--yes", "--seed=phb-classes"], transport)).rejects.toThrow(
      "claimed by another seed run",
    );
    expect(filesExecuted).toHaveLength(1);
  });

  it("adopts historical seeds without running SQL or migrations and deduplicates selections", async () => {
    const transport = vi.fn(execute);
    await run(
      ["--mark-applied", "--migrate-local", "--seed", "phb-classes", "--seed=phb-classes"],
      transport,
    );
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls.some(([args]) => args.includes("migrations"))).toBe(false);
    expect(filesExecuted).toHaveLength(0);
    await run(["--yes"]);
    expect(filesExecuted).toHaveLength(1);
    expect(database.prepare("SELECT name FROM events").all()).toEqual([{ name: "second" }]);
  });

  it("keeps history in the target database and passes the selected remote mode", async () => {
    await run(["--yes"]);
    const localDatabase = database;
    database = new DatabaseSync(":memory:");
    database.exec("CREATE TABLE events (name TEXT NOT NULL)");
    try {
      await run(["--remote", "--yes"], (args) => {
        expect(args).toContain("--remote");
        expect(args).not.toContain("--local");
        return execute(args);
      });
      expect(filesExecuted).toHaveLength(4);
    } finally {
      localDatabase.close();
    }
  });

  it("escapes seed filenames and preserves nested order", async () => {
    seed("phb-classes/nested/02-quote's.sql", "INSERT INTO events VALUES ('nested')");
    await run(["--yes", "--seed=phb-classes"]);
    await run(["--yes", "--seed=phb-classes"]);
    expect(filesExecuted).toHaveLength(2);
  });

  it("rejects invalid selection and mixed migration targets before confirmation", async () => {
    await expect(run(["--seed=missing"])).rejects.toThrow("Unknown seed directory");
    await expect(run(["--remote", "--migrate-local"])).rejects.toThrow("cannot be combined");
    expect(confirm).not.toHaveBeenCalled();
  });
});

describe("Wrangler transport", () => {
  it("closes child stdin, uses CI and pins the source config", () => {
    vi.mocked(spawnSync).mockReturnValue({
      pid: 1,
      output: [],
      stdout: '[{"success":true,"results":[{"path":"seed.sql"}]}]',
      stderr: "",
      status: 0,
      signal: null,
    });
    expect(executeWrangler(["d1", "execute", "DB", "--local", "--yes", "--json"], cwd)).toEqual([
      { path: "seed.sql" },
    ]);
    expect(spawnSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(["--config", join(cwd, "wrangler.jsonc")]),
      expect.objectContaining({
        stdio: ["ignore", "pipe", "inherit"],
        env: expect.objectContaining({ CI: "true" }),
      }),
    );
  });

  it("rejects failed SQL even if the child exits successfully", () => {
    vi.mocked(spawnSync).mockReturnValue({
      pid: 1,
      output: [],
      stdout: '[{"success":false}]',
      stderr: "",
      status: 0,
      signal: null,
    });
    expect(() => executeWrangler(["--json"], cwd)).toThrow("did not confirm");
  });
});
