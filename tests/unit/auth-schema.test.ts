import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { betterAuth } from "better-auth";
import { admin, username } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getAuthTables } from "@better-auth/core/db";
import * as schema from "@/infrastructure/database/schema/auth";

const directory = fileURLToPath(new URL("../../drizzle/", import.meta.url));
const migrations = readdirSync(directory)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(`${directory}/${file}`, "utf8"))
  .join("\n");
const adminOptions = { defaultRole: "user", adminRoles: ["admin"] };
const preciseDate = new Date("2026-09-05T12:00:00.123Z");
let sqlite: DatabaseSync;

function database() {
  return drizzle(
    async (query, parameters, method) => {
      const statement = sqlite.prepare(query);
      if (method === "run") {
        statement.run(...parameters);
        return { rows: [] };
      }
      statement.setReturnArrays(true);
      if (method === "get") return { rows: Object.values(statement.get(...parameters) ?? {}) };
      return { rows: statement.all(...parameters) };
    },
    { schema },
  );
}
function authInstance() {
  return betterAuth({
    baseURL: "http://localhost:3000",
    secret: "test-only-auth-schema-secret-never-use-in-production",
    database: drizzleAdapter(database(), { provider: "sqlite", usePlural: true, schema }),
    plugins: [admin(adminOptions)],
    emailAndPassword: { enabled: true },
    advanced: { database: { joins: true } },
    logger: { disabled: true },
  });
}
function insertUser(id = "user", role = "user") {
  sqlite
    .prepare("INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)")
    .run(id, id, `${id}@example.test`, role);
}
function cookieHeaders(response: Response) {
  return new Headers({
    cookie: response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; "),
  });
}
beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  sqlite.exec(migrations);
});
afterEach(() => {
  expect(sqlite.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  sqlite.close();
});

describe("Better Auth 1.7.18 persistence", () => {
  it("matches every installed core/Admin field and date representation", () => {
    const expected = getAuthTables({ plugins: [admin(adminOptions), username()] });
    const tables = {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    };
    expect(Object.keys(expected).sort()).toEqual(Object.keys(tables).sort());
    for (const [model, table] of Object.entries(tables)) {
      const definition = expected[model];
      if (!definition) throw new Error(`Missing expected ${model}`);
      const columns = getTableConfig(table).columns;
      const names = Object.keys(table).filter((key) => key !== "enableRLS");
      for (const [key, field] of Object.entries(definition.fields)) {
        expect(names).toContain(key);
        const sqlName = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        const column = columns.find((candidate) => candidate.name === sqlName);
        expect(column, `${model}.${key}`).toBeDefined();
        if (!column) throw new Error(`Missing ${model}.${key}`);
        if (field.required) expect(column.notNull).toBe(true);
        if (field.type === "date") {
          expect(column.dataType).toBe("date");
          expect("mode" in column && column.mode).toBe("timestamp_ms");
        }
        if (field.type === "boolean") expect(column.dataType).toBe("boolean");
      }
      expect(columns).toHaveLength(Object.keys(definition.fields).length + 1);
      const id = columns.find((column) => column.name === "id");
      expect(id?.defaultFn).toBeUndefined();
      expect(id?.notNull).toBe(true);
    }
    expect(expected["account"]?.fields).not.toHaveProperty("issuer");
    const accountIndexes = getTableConfig(schema.accounts).indexes.map(
      (entry) => entry.config.name,
    );
    expect(accountIndexes).toContain("accounts_provider_account_id_uq");
    expect(accountIndexes).not.toContain("accounts_issuer_account_id_uq");
  });

  it("defaults to user, supports admin and bans, and rejects other roles and duplicate emails", async () => {
    const db = database();
    await db
      .insert(schema.users)
      .values({ id: "normal", name: "Normal", email: "normal@example.test" });
    const normal = await db.query.users.findFirst();
    expect(normal).toMatchObject({ role: "user", emailVerified: false, banned: false });
    expect(normal?.createdAt).toBeInstanceOf(Date);
    insertUser("admin", "admin");
    for (const role of ["dm", "premium", "admin,user", ""]) {
      expect(() => insertUser("invalid", role)).toThrow(/CHECK/);
    }
    expect(() => sqlite.exec("UPDATE users SET role = NULL WHERE id = 'normal'")).toThrow(
      /NOT NULL/,
    );
    expect(() => sqlite.exec("UPDATE users SET email_verified = 2 WHERE id = 'normal'")).toThrow(
      /CHECK/,
    );
    expect(() =>
      sqlite.exec("UPDATE users SET email = 'normal@example.test' WHERE id = 'admin'"),
    ).toThrow(/UNIQUE/);
    await db
      .update(schema.users)
      .set({ banned: true, banReason: "Test ban", banExpires: preciseDate })
      .where(eq(schema.users.id, "normal"));
    expect(
      (await db.query.users.findFirst({ where: eq(schema.users.id, "normal") }))?.banExpires,
    ).toEqual(preciseDate);
    expect(
      sqlite.prepare("SELECT ban_expires FROM users WHERE id = 'normal'").get()?.["ban_expires"],
    ).toBe(preciseDate.getTime());
  });

  it("enforces session tokens/ownership, cascades owned auth rows and preserves impersonation provenance", async () => {
    insertUser();
    insertUser("admin", "admin");
    const db = database();
    await db.insert(schema.sessions).values({
      id: "session",
      userId: "user",
      token: "test-session-token",
      expiresAt: preciseDate,
      impersonatedBy: "admin",
    });
    await expect(
      db.insert(schema.sessions).values({
        id: "duplicate",
        userId: "user",
        token: "test-session-token",
        expiresAt: preciseDate,
      }),
    ).rejects.toThrow();
    await expect(
      db
        .insert(schema.sessions)
        .values({ id: "orphan", userId: "missing", token: "orphan-token", expiresAt: preciseDate }),
    ).rejects.toThrow();
    await db.insert(schema.accounts).values({
      id: "account",
      userId: "user",
      accountId: "user",
      providerId: "credential",
    });
    const session = await db.query.sessions.findFirst({ with: { user: true } });
    expect(session?.expiresAt).toEqual(preciseDate);
    expect(session?.user.id).toBe("user");
    sqlite.exec("DELETE FROM users WHERE id = 'admin'");
    expect((await db.query.sessions.findFirst())?.impersonatedBy).toBe("admin");
    sqlite.exec("DELETE FROM users WHERE id = 'user'");
    expect(await db.select().from(schema.sessions)).toEqual([]);
    expect(await db.select().from(schema.accounts)).toEqual([]);
  });

  it("keys accounts by provider and subject", async () => {
    insertUser();
    insertUser("other");
    const db = database();
    await db.insert(schema.accounts).values({
      id: "a",
      userId: "user",
      accountId: "subject",
      providerId: "provider-a",
      accessTokenExpiresAt: preciseDate,
    });
    await expect(
      db.insert(schema.accounts).values({
        id: "duplicate",
        userId: "other",
        accountId: "subject",
        providerId: "provider-a",
      }),
    ).rejects.toThrow();
    await db.insert(schema.accounts).values({
      id: "other-provider",
      userId: "other",
      accountId: "subject",
      providerId: "provider-b",
    });
    await expect(
      db.insert(schema.accounts).values({
        id: "orphan",
        userId: "missing",
        accountId: "missing",
        providerId: "credential",
      }),
    ).rejects.toThrow();
    expect(
      (await db.query.accounts.findFirst({ where: eq(schema.accounts.id, "a") }))
        ?.accessTokenExpiresAt,
    ).toEqual(preciseDate);
  });

  it("allows multiple pre-user verification challenges with millisecond expiry", async () => {
    const db = database();
    for (const id of ["a", "b"]) {
      await db.insert(schema.verifications).values({
        id,
        identifier: "pending@example.test",
        value: `test-challenge-${id}`,
        expiresAt: preciseDate,
      });
    }
    expect(await db.select().from(schema.users)).toEqual([]);
    expect(await db.select().from(schema.verifications)).toHaveLength(2);
    expect((await db.query.verifications.findFirst())?.expiresAt).toEqual(preciseDate);
    sqlite.prepare("DELETE FROM verifications WHERE expires_at <= ?").run(preciseDate.getTime());
    expect(await db.select().from(schema.verifications)).toEqual([]);
  });

  it("runs real Better Auth signup, session joins, Admin role changes, bans and impersonation", async () => {
    const auth = authInstance();
    const owner = await auth.api.signUpEmail({
      body: { name: "Owner", email: "owner@example.test", password: "test-only-password-123" },
    });
    const member = await auth.api.signUpEmail({
      body: { name: "Member", email: "member@example.test", password: "test-only-password-456" },
    });
    expect(owner.user.role).toBe("user");
    expect(member.user.role).toBe("user");
    const db = database();
    const credential = await db.query.accounts.findFirst({
      where: eq(schema.accounts.userId, owner.user.id),
    });
    expect(credential?.providerId).toBe("credential");
    expect(credential?.accountId).toBe(owner.user.id);
    expect(credential?.password).toBeTruthy();
    expect(credential?.password === "test-only-password-123").toBe(false);
    expect("password" in owner.user).toBe(false);
    // Test bootstrap only; production elevation is an authorized Admin operation.
    await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, owner.user.id));
    const login = await auth.api.signInEmail({
      body: { email: "owner@example.test", password: "test-only-password-123" },
      asResponse: true,
    });
    const headers = cookieHeaders(login);
    expect((await auth.api.getSession({ headers }))?.user.role).toBe("admin");
    await auth.api.setRole({ headers, body: { userId: member.user.id, role: "admin" } });
    expect(
      (await db.query.users.findFirst({ where: eq(schema.users.id, member.user.id) }))?.role,
    ).toBe("admin");
    await auth.api.setRole({ headers, body: { userId: member.user.id, role: "user" } });
    await auth.api.impersonateUser({ headers, body: { userId: member.user.id } });
    expect(
      (
        await db.query.sessions.findFirst({
          where: eq(schema.sessions.impersonatedBy, owner.user.id),
        })
      )?.userId,
    ).toBe(member.user.id);
    await auth.api.banUser({
      headers,
      body: { userId: member.user.id, banReason: "Test ban", banExpiresIn: 60 },
    });
    const banned = await db.query.users.findFirst({ where: eq(schema.users.id, member.user.id) });
    expect(banned?.banned).toBe(true);
    expect(banned?.banExpires).toBeInstanceOf(Date);
    await expect(
      auth.api.signInEmail({
        body: { email: "member@example.test", password: "test-only-password-456" },
      }),
    ).rejects.toThrow();
    await auth.api.unbanUser({ headers, body: { userId: member.user.id } });
    expect(
      (await db.query.users.findFirst({ where: eq(schema.users.id, member.user.id) }))?.banExpires,
    ).toBeNull();
  });
});
