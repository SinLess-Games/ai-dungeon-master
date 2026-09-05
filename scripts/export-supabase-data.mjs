/** Export application tables for a fresh D1 database; Auth and Storage stay in Supabase. */
import { mkdir, readFile, writeFile } from "node:fs/promises";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.");
const schema = await readFile(
  new URL("../migrations/0001_application.sql", import.meta.url),
  "utf8",
);
const tables = [...schema.matchAll(/CREATE TABLE (\w+) \(([\s\S]*?)\n\);/g)].map(
  ([, name, definition]) => ({
    name,
    columns: new Set(
      [...definition.matchAll(/^  (\w+) (?:TEXT|text|INTEGER|integer)/gm)].map((m) => m[1]),
    ),
  }),
);
const literal = (value) => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite number in export");
    return String(value);
  }
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (text.includes("\0")) throw new Error("NUL bytes cannot be exported as SQL text");
  return "'" + text.replaceAll("'", "''") + "'";
};
const statements = [
  "-- Contains private application data. Do not commit or share this file.",
  "-- Import ONLY into a fresh D1 database after applying 0001_application.sql.",
  // Imported titles retain their UUIDs. Remove only the initial seed titles;
  // fail if any application records already exist rather than overwrite data.
  "CREATE TABLE _codex_import_guard (empty INTEGER CHECK (empty = 1));",
  "INSERT INTO _codex_import_guard SELECT CASE WHEN " +
    tables
      .filter((t) => t.name !== "titles")
      .map((t) => `(SELECT COUNT(*) FROM "${t.name}") = 0`)
      .join(" AND ") +
    " THEN 1 ELSE 0 END;",
  "DROP TABLE _codex_import_guard;",
  "DELETE FROM titles;",
];
for (const { name, columns } of tables) {
  let count = 0;
  for (let offset = 0; ; offset += 500) {
    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/${name}?select=*&order=id.asc&offset=${offset}&limit=500`,
      {
        headers: {
          apikey: key,
          ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }),
        },
      },
    );
    if (!response.ok)
      throw new Error(`Export of ${name} failed (HTTP ${response.status}). No output written.`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error(`Invalid response for ${name}`);
    for (const row of rows) {
      const names = Object.keys(row).filter((column) => columns.has(column));
      const longValues = new Map();
      for (const column of names) {
        const value = row[column];
        const text = value !== null && typeof value === "object" ? JSON.stringify(value) : value;
        if (typeof text === "string" && text.length > 1024) {
          longValues.set(column, text);
        }
      }
      statements.push(
        `INSERT INTO "${name}" (${names.map((column) => `"${column}"`).join(", ")}) VALUES (${names.map((column) => literal(longValues.has(column) ? "" : row[column])).join(", ")});`,
      );
      // Large campaign JSON must not exceed D1's SQL statement-size limit.
      // Split by code point so an emoji is never split into invalid UTF-8.
      for (const [column, text] of longValues) {
        const points = Array.from(text);
        for (let i = 0; i < points.length; i += 8192) {
          statements.push(
            `UPDATE "${name}" SET "${column}" = "${column}" || ${literal(points.slice(i, i + 8192).join(""))} WHERE id = ${literal(row.id)};`,
          );
        }
      }
    }
    count += rows.length;
    if (rows.length < 500) break;
  }
  console.log(`${name}: ${count} rows`);
}
await mkdir(".data-migration", { recursive: true, mode: 0o700 });
await writeFile(".data-migration/supabase.sql", statements.join("\n") + "\n", { mode: 0o600 });
console.log("Wrote .data-migration/supabase.sql. Auth users and Storage objects were not changed.");
