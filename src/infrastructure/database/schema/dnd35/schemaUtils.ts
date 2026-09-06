import { sql } from "drizzle-orm";
import type { SQLWrapper } from "drizzle-orm";
import { check, integer, text } from "drizzle-orm/sqlite-core";

/** Fresh builders per table; these helpers only construct persistence definitions. */
export const uuid = () =>
  text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID());
export const timestamps = () => ({
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});
export const enumCheck = (name: string, column: SQLWrapper, values: readonly string[]) =>
  check(
    name,
    sql`${column} in (${sql.join(
      values.map((value) => sql.raw("'" + value.replaceAll("'", "''") + "'")),
      sql`, `,
    )})`,
  );
export const nonEmpty = (name: string, column: SQLWrapper) =>
  check(name, sql`length(trim(${column})) > 0`);
export const nonNegative = (name: string, column: SQLWrapper) => check(name, sql`${column} >= 0`);
export const positive = (name: string, column: SQLWrapper) => check(name, sql`${column} > 0`);
export const booleanCheck = (name: string, column: SQLWrapper) =>
  check(name, sql`${column} in (0, 1)`);
/** SQLite verifies JSON syntax and container kind; boundary validation verifies the payload type. */
export const jsonCheck = (name: string, column: SQLWrapper, kind: "object" | "array" = "object") =>
  check(
    name,
    sql`case when ${column} is null then 1 when json_valid(${column}) then json_type(${column}) = ${sql.raw(kind === "object" ? "'object'" : "'array'")} else 0 end`,
  );
