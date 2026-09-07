import { DatabaseSync, type StatementSync } from "node:sqlite";

class SqliteD1PreparedStatement {
  constructor(
    private readonly database: DatabaseSync,
    readonly sql: string,
    readonly values: readonly unknown[] = [],
  ) {}

  bind(...values: unknown[]) {
    return new SqliteD1PreparedStatement(this.database, this.sql, values);
  }

  private statement(): StatementSync {
    return this.database.prepare(this.sql);
  }

  async first<T = Record<string, unknown>>(columnName?: string): Promise<T | null> {
    const row = this.statement().get(...this.values) as Record<string, unknown> | undefined;
    if (!row) return null;
    if (columnName !== undefined) return (row[columnName] ?? null) as T | null;
    return row as T;
  }

  async all<T = Record<string, unknown>>() {
    const results = this.statement().all(...this.values) as T[];
    return { success: true, results, meta: { changes: 0 } };
  }

  async raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[]> {
    const statement = this.statement();
    const rows = statement.all(...this.values) as Record<string, unknown>[];
    const names = statement.columns().map((column) => column.name);
    const values = rows.map((row) => names.map((name) => row[name]));
    return (options?.columnNames ? [names, ...values] : values) as T[];
  }

  async run<T = Record<string, unknown>>() {
    const result = this.statement().run(...this.values);
    return {
      success: true,
      results: [] as T[],
      meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) },
    };
  }
}

/** Minimal D1 surface backed by node:sqlite for authoritative service tests. */
export function createSqliteD1(database: DatabaseSync): D1Database {
  const binding = {
    prepare(sql: string) {
      return new SqliteD1PreparedStatement(database, sql);
    },
    async batch(statements: readonly SqliteD1PreparedStatement[]) {
      database.exec("BEGIN IMMEDIATE");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        database.exec("COMMIT");
        return results;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
    async exec(sql: string) {
      database.exec(sql);
      return { count: 1, duration: 0 };
    },
  };
  return binding as unknown as D1Database;
}
