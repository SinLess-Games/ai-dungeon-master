import type { Database } from "@/integrations/supabase/types";
import { TABLE_COLUMNS, type TableName } from "./schema";

export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}
export interface AppDatabase {
  prepare(sql: string): D1Statement;
  batch<T = Record<string, unknown>>(
    statements: D1Statement[],
  ): Promise<{ results: T[]; success: boolean }[]>;
}
// The adapter is server-only. No SQL, table names, or query plans are accepted from clients.
type Row = Record<string, unknown>;
type Result<T> = { data: T | null; error: { message: string } | null; count: number | null };
export type DatabaseScope = { userId: string | null; admin: boolean; service?: boolean };
const owned = new Set(["characters", "worlds", "campaigns", "game_maps", "dice_rolls"]);
const jsonColumns = new Set(["data", "tags"]);
const booleans = new Set(["is_active", "featured_as_update", "cancel_at_period_end"]);
const encode = (v: unknown): unknown =>
  typeof v === "boolean" ? Number(v) : v !== null && typeof v === "object" ? JSON.stringify(v) : v;
function decode(row: Row): Row {
  for (const key of Object.keys(row)) {
    if (jsonColumns.has(key) && typeof row[key] === "string") row[key] = JSON.parse(row[key]);
    if (booleans.has(key)) row[key] = Boolean(row[key]);
  }
  return row;
}

export class DatabaseClient {
  constructor(
    readonly binding: AppDatabase,
    readonly scope: DatabaseScope,
  ) {}
  from<T extends TableName>(table: T) {
    if (!Object.hasOwn(TABLE_COLUMNS, table)) throw new Error("Unknown database table");
    return new Query<T>(this, table);
  }
  async rpc(name: string, args: { _user_id: string; _role: string }): Promise<Result<boolean>> {
    if (name !== "has_role" || (!this.scope.service && args._user_id !== this.scope.userId))
      throw new Error("Forbidden");
    const row = await this.binding
      .prepare("SELECT 1 FROM user_roles WHERE user_id = ? AND role = ?")
      .bind(args._user_id, args._role)
      .first();
    return { data: Boolean(row), error: null, count: null };
  }
}

type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];
class Query<T extends TableName> implements PromiseLike<Result<TableRow<T>[]>> {
  private operation: "select" | "insert" | "upsert" | "update" | "delete" = "select";
  private columns = "*";
  private filters: string[] = [];
  private values: unknown[] = [];
  private rows: Row[] = [];
  private conflict = "id";
  private ordering = "";
  private maximum: number | undefined;
  private offset = 0;
  private countOnly = false;
  private joinTitles = false;
  constructor(
    private client: DatabaseClient,
    private table: T,
  ) {}
  private column(name: string) {
    if (!(TABLE_COLUMNS[this.table] as readonly string[]).includes(name))
      throw new Error(`Unknown column: ${name}`);
    return `"${name}"`;
  }
  select(columns = "*", options?: { count?: string; head?: boolean }) {
    this.joinTitles = columns.includes("titles(name, rarity)");
    this.columns = columns.replace(/,\s*titles\(name, rarity\)/, "");
    if (this.columns !== "*") this.columns.split(",").forEach((c) => this.column(c.trim()));
    this.countOnly = Boolean(options?.head);
    return this;
  }
  eq(column: string, value: unknown) {
    this.filters.push(`${this.column(column)} = ?`);
    this.values.push(encode(value));
    return this;
  }
  neq(column: string, value: unknown) {
    this.filters.push(`${this.column(column)} != ?`);
    this.values.push(encode(value));
    return this;
  }
  in(column: string, values: unknown[]) {
    this.filters.push(`${this.column(column)} IN (SELECT value FROM json_each(?))`);
    this.values.push(JSON.stringify(values.map(encode)));
    return this;
  }
  order(column: string, options?: { ascending?: boolean }) {
    this.ordering = ` ORDER BY ${this.column(column)} ${options?.ascending === false ? "DESC" : "ASC"}`;
    return this;
  }
  limit(n: number) {
    if (!Number.isSafeInteger(n) || n < 0) throw new Error("Invalid limit");
    this.maximum = n;
    return this;
  }
  range(start: number, end: number) {
    this.offset = start;
    return this.limit(end - start + 1);
  }
  insert(rows: Row | Row[]) {
    this.operation = "insert";
    this.rows = Array.isArray(rows) ? rows : [rows];
    return this;
  }
  upsert(rows: Row | Row[], options?: { onConflict?: string }) {
    this.insert(rows);
    this.operation = "upsert";
    this.conflict = options?.onConflict ?? "id";
    return this;
  }
  update(row: Row) {
    this.operation = "update";
    this.rows = [row];
    return this;
  }
  delete() {
    this.operation = "delete";
    return this;
  }
  async maybeSingle<R = TableRow<T>>(): Promise<Result<R>> {
    const result = await this.execute();
    if ((result.data?.length ?? 0) > 1) throw new Error("Expected at most one row");
    return { ...result, data: (result.data?.[0] as R | undefined) ?? null };
  }
  async single<R = TableRow<T>>(): Promise<Result<R>> {
    const result = await this.maybeSingle<R>();
    if (!result.data) throw new Error("Row not found");
    return result;
  }
  then<TResult1 = Result<TableRow<T>[]>, TResult2 = never>(
    onfulfilled?: ((value: Result<TableRow<T>[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return (this.execute() as Promise<Result<TableRow<T>[]>>).then(onfulfilled, onrejected);
  }
  private policy(): { sql: string; values: unknown[] } {
    const { userId, admin, service } = this.client.scope;
    if (service) return { sql: "1", values: [] };
    const read = this.operation === "select";
    if (this.table === "dev_blog_posts" && read && !admin)
      return {
        sql: "(status = 'published' OR (status = 'scheduled' AND scheduled_at <= ?))",
        values: [new Date().toISOString()],
      };
    if (this.table === "titles" && read) return { sql: admin ? "1" : "is_active = 1", values: [] };
    if (!userId) throw new Error("Unauthorized");
    if (owned.has(this.table)) return { sql: "user_id = ?", values: [userId] };
    if (this.table === "profiles")
      return { sql: read ? "1" : "id = ?", values: read ? [] : [userId] };
    if (this.table === "user_roles" && read) return { sql: "user_id = ?", values: [userId] };
    if (this.table === "subscriptions" && read)
      return { sql: admin ? "1" : "user_id = ?", values: admin ? [] : [userId] };
    if (
      this.table === "player_titles" &&
      (read || this.operation === "upsert" || this.operation === "insert")
    )
      return { sql: admin ? "1" : "user_id = ?", values: admin ? [] : [userId] };
    if (this.table === "feedback" && (read || this.operation === "insert"))
      return { sql: admin && read ? "1" : "user_id = ?", values: admin && read ? [] : [userId] };
    if (this.table === "admin_message_reads" && admin)
      return { sql: "admin_id = ?", values: [userId] };
    if (
      admin &&
      ["titles", "player_titles", "feedback", "dev_blog_posts", "dev_blog_audit"].includes(
        this.table,
      )
    )
      return { sql: "1", values: [] };
    throw new Error("Forbidden");
  }
  private async validateRow(row: Row) {
    Object.keys(row).forEach((k) => this.column(k));
    const { userId, admin, service } = this.client.scope;
    if (service) return;
    const owner =
      this.table === "profiles"
        ? "id"
        : this.table === "admin_message_reads"
          ? "admin_id"
          : "user_id";
    const requiresOwner =
      owned.has(this.table) ||
      this.table === "profiles" ||
      this.table === "admin_message_reads" ||
      (this.table === "feedback" && this.operation === "insert") ||
      (this.table === "player_titles" && !admin);
    if (
      requiresOwner &&
      ((row[owner] !== undefined && row[owner] !== userId) ||
        (this.operation !== "update" && row[owner] !== userId))
    )
      throw new Error("Forbidden owner");
    for (const [key, table] of [
      ["world_id", "worlds"],
      ["campaign_id", "campaigns"],
    ] as const) {
      if (!owned.has(this.table) || !row[key]) continue;
      const parent = await this.client.binding
        .prepare(`SELECT id FROM ${table} WHERE id = ? AND user_id = ?`)
        .bind(row[key], userId)
        .first();
      if (!parent) throw new Error("Parent does not belong to this account");
    }
  }
  private async execute(): Promise<Result<Row[]>> {
    const policy = this.policy();
    const where = [policy.sql, ...this.filters].map((f) => `(${f})`).join(" AND ");
    const bindings = [...policy.values, ...this.values];
    const table = `"${this.table}"`;
    const db = this.client.binding;
    let data: Row[] = [];
    if (this.operation === "select") {
      const columns = this.countOnly
        ? "COUNT(*) AS count"
        : this.columns + (this.joinTitles ? ", title_id" : "");
      const limit =
        this.maximum === undefined ? "" : ` LIMIT ${this.maximum} OFFSET ${this.offset}`;
      data = (
        await db
          .prepare(`SELECT ${columns} FROM ${table} WHERE ${where}${this.ordering}${limit}`)
          .bind(...bindings)
          .all<Row>()
      ).results;
      if (this.countOnly)
        return { data: null, count: Number(data[0]?.["count"] ?? 0), error: null };
    } else if (this.operation === "delete") {
      data = (
        await db
          .prepare(`DELETE FROM ${table} WHERE ${where} RETURNING *`)
          .bind(...bindings)
          .all<Row>()
      ).results;
    } else {
      const statements: D1Statement[] = [];
      for (const input of this.rows) {
        const row = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
        await this.validateRow(row);
        if (
          (TABLE_COLUMNS[this.table] as readonly string[]).includes("updated_at") &&
          !row["updated_at"]
        )
          row["updated_at"] = new Date().toISOString();
        const keys = Object.keys(row);
        if (!keys.length) continue;
        const values = keys.map((k) => encode(row[k]));
        if (this.operation === "update") {
          statements.push(
            db
              .prepare(
                `UPDATE ${table} SET ${keys.map((k) => `${this.column(k)} = ?`).join(",")} WHERE ${where} RETURNING *`,
              )
              .bind(...values, ...bindings),
          );
        } else {
          let conflict = "";
          if (this.operation === "upsert") {
            const conflictKeys = this.conflict.split(",").map((k) => k.trim());
            conflictKeys.forEach((k) => this.column(k));
            const updates = keys.filter((k) => !conflictKeys.includes(k));
            conflict = updates.length
              ? ` ON CONFLICT (${conflictKeys.map((k) => this.column(k)).join(",")}) DO UPDATE SET ${updates.map((k) => `${this.column(k)} = excluded.${this.column(k)}`).join(",")} WHERE ${policy.sql}`
              : ` ON CONFLICT (${conflictKeys.map((k) => this.column(k)).join(",")}) DO NOTHING`;
            if (updates.length && owned.has(this.table) && row["updated_at"])
              conflict += ` AND excluded.updated_at >= ${table}.updated_at`;
          }
          statements.push(
            db
              .prepare(
                `INSERT INTO ${table} (${keys.map((k) => this.column(k)).join(",")}) VALUES (${keys.map(() => "?").join(",")})${conflict} RETURNING *`,
              )
              .bind(...values, ...(conflict.includes("DO UPDATE") ? policy.values : [])),
          );
        }
      }
      // Stay within D1 statement parameter limits; each row is a prepared statement.
      for (let i = 0; i < statements.length; i += 50)
        data.push(...(await db.batch<Row>(statements.slice(i, i + 50))).flatMap((r) => r.results));
    }
    data = data.map(decode);
    if (this.joinTitles && this.table === "player_titles") {
      for (const row of data)
        row["titles"] = await db
          .prepare("SELECT name, rarity FROM titles WHERE id = ?")
          .bind(row["title_id"])
          .first();
    }
    return { data, error: null, count: data.length };
  }
}
