// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import {
  DatabaseClient,
  type AppDatabase,
  type D1Statement,
} from "../../src/integrations/d1/query.server";

let sqlite: DatabaseSync;
let binding: AppDatabase;
let alice: DatabaseClient;
let bob: DatabaseClient;
let service: DatabaseClient;
beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("migrations/0001_application.sql", "utf8"));
  const prepare = (sql: string): D1Statement => {
    let args: unknown[] = [];
    return {
      bind(...values) {
        args = values;
        return this;
      },
      async all() {
        return { results: sqlite.prepare(sql).all(...(args as never[])) as never[], success: true };
      },
      async first() {
        return (sqlite.prepare(sql).get(...(args as never[])) ?? null) as never;
      },
    };
  };
  binding = {
    prepare,
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const result = await Promise.all(statements.map((s) => s.all()));
        sqlite.exec("COMMIT");
        return result as never;
      } catch (e) {
        sqlite.exec("ROLLBACK");
        throw e;
      }
    },
  };
  alice = new DatabaseClient(binding, { userId: "alice", admin: false });
  bob = new DatabaseClient(binding, { userId: "bob", admin: false });
  service = new DatabaseClient(binding, { userId: null, admin: false, service: true });
});
afterEach(() => sqlite.close());

describe("D1 application access", () => {
  it("preserves JSON and enforces ownership on reads, updates, deletes and conflicting upserts", async () => {
    await alice.from("characters").upsert({
      id: "hero",
      user_id: "alice",
      data: { name: "Hero", level: 3 },
      updated_at: "2026-09-04T00:00:00Z",
    });
    expect((await alice.from("characters").select("*")).data?.[0]?.data).toEqual({
      name: "Hero",
      level: 3,
    });
    expect((await bob.from("characters").select("*")).data).toEqual([]);
    await bob.from("characters").update({ name: "stolen" }).eq("id", "hero");
    await bob.from("characters").delete().eq("id", "hero");
    await bob.from("characters").upsert({ id: "hero", user_id: "bob", name: "stolen" });
    expect((await alice.from("characters").select("*")).data?.[0]?.user_id).toBe("alice");
    await expect(bob.from("characters").upsert({ id: "other", user_id: "alice" })).rejects.toThrow(
      "Forbidden owner",
    );
    await expect(
      alice.from("characters").update({ user_id: "bob" }).eq("id", "hero"),
    ).rejects.toThrow("Forbidden owner");
  });
  it("rejects cross-account parent references and stale saved data", async () => {
    await alice.from("worlds").insert({ id: "world", user_id: "alice" });
    await expect(
      bob.from("campaigns").insert({ id: "campaign", user_id: "bob", world_id: "world" }),
    ).rejects.toThrow("Parent");
    await alice
      .from("characters")
      .upsert({ id: "hero", user_id: "alice", name: "new", updated_at: "2026-09-04T00:00:00Z" });
    await alice
      .from("characters")
      .upsert({ id: "hero", user_id: "alice", name: "old", updated_at: "2026-01-01T00:00:00Z" });
    expect((await alice.from("characters").select("name").single()).data?.name).toBe("new");
  });
  it("limits anonymous blog reads to published and due scheduled posts", async () => {
    await service.from("dev_blog_posts").insert([
      { slug: "draft", status: "draft" },
      { slug: "live", status: "published" },
      { slug: "due", status: "scheduled", scheduled_at: "2020-01-01T00:00:00Z" },
      { slug: "future", status: "scheduled", scheduled_at: "2099-01-01T00:00:00Z" },
    ]);
    const anonymous = new DatabaseClient(binding, { userId: null, admin: false });
    expect(
      (await anonymous.from("dev_blog_posts").select("slug").order("slug")).data?.map(
        (r) => r.slug,
      ),
    ).toEqual(["due", "live"]);
    await expect(anonymous.from("profiles").select("*")).rejects.toThrow("Unauthorized");
    await expect(alice.from("dev_blog_posts").insert({ slug: "attack" })).rejects.toThrow(
      "Forbidden",
    );
  });
  it("protects roles and billing, and permits admin moderation", async () => {
    await expect(
      alice.from("user_roles").insert({ user_id: "alice", role: "admin" }),
    ).rejects.toThrow("Forbidden");
    await expect(alice.from("subscriptions").update({ status: "active" })).rejects.toThrow(
      "Forbidden",
    );
    await alice.from("feedback").insert({ user_id: "alice", title: "A bug" });
    await expect(alice.from("feedback").update({ status: "done" })).rejects.toThrow("Forbidden");
    const admin = new DatabaseClient(binding, { userId: "admin", admin: true });
    await admin.from("feedback").update({ status: "done" });
    expect((await alice.from("feedback").select("status").single()).data?.status).toBe("done");
  });
  it("supports compound conflicts, title joins, boolean decoding, counts and deletion cascades", async () => {
    const title = (await alice.from("titles").select("*").limit(1).single()).data!;
    expect(title.is_active).toBe(true);
    await alice
      .from("player_titles")
      .upsert({ user_id: "alice", title_id: title.id }, { onConflict: "user_id,title_id" });
    await alice
      .from("player_titles")
      .upsert({ user_id: "alice", title_id: title.id }, { onConflict: "user_id,title_id" });
    const held = await service
      .from("player_titles")
      .select("user_id, awarded_at, titles(name, rarity)");
    expect((held.data?.[0] as unknown as { titles: { name: string } }).titles.name).toBe(
      title.name,
    );
    expect(
      (await alice.from("player_titles").select("id", { count: "exact", head: true })).count,
    ).toBe(1);
    await service.from("titles").delete().eq("id", title.id);
    expect((await alice.from("player_titles").select("*")).data).toEqual([]);
  });
  it("binds values and rejects injected identifiers", async () => {
    await alice
      .from("characters")
      .insert({ id: "safe", user_id: "alice", name: "'; DROP TABLE characters; --" });
    expect((await alice.from("characters").select("*")).data).toHaveLength(1);
    expect(() => alice.from("characters").eq("id) OR 1=1 --", "safe")).toThrow("Unknown column");
  });
});
