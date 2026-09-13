import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, it } from "vitest";

function listSqlFiles(path: string): string[] {
  return readdirSync(path)
    .sort((a, b) => a.localeCompare(b))
    .flatMap((name) => {
      const child = join(path, name);
      if (statSync(child).isDirectory()) return listSqlFiles(child);
      return name.endsWith(".sql") ? [child] : [];
    });
}

function inspectJsonLiterals(path: string): string[] {
  const sql = readFileSync(path, "utf8");
  const issues: string[] = [];
  let index = 0;
  let line = 1;

  while (index < sql.length) {
    if (sql[index] === "-" && sql[index + 1] === "-") {
      index += 2;
      while (index < sql.length && sql[index] !== "\n") index += 1;
      continue;
    }

    if (sql[index] === "/" && sql[index + 1] === "*") {
      index += 2;
      while (index < sql.length && !(sql[index] === "*" && sql[index + 1] === "/")) {
        if (sql[index] === "\n") line += 1;
        index += 1;
      }
      if (index < sql.length) index += 2;
      continue;
    }

    if (sql[index] !== "'") {
      if (sql[index] === "\n") line += 1;
      index += 1;
      continue;
    }

    const startLine = line;
    let value = "";
    let closed = false;
    index += 1;

    while (index < sql.length) {
      const char = sql[index];

      if (char === "'") {
        if (sql[index + 1] === "'") {
          value += "'";
          index += 2;
          continue;
        }

        index += 1;
        closed = true;
        break;
      }

      if (char === "\n") line += 1;
      value += char;
      index += 1;
    }

    if (!closed) {
      issues.push(`${relative(process.cwd(), path)}:${startLine}: unterminated SQL string literal`);
      break;
    }

    const trimmed = value.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) continue;

    try {
      JSON.parse(trimmed);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push(`${relative(process.cwd(), path)}:${startLine}: invalid JSON literal: ${message}`);
    }
  }

  return issues;
}

function inspectD1Compatibility(path: string): string[] {
  const sql = readFileSync(path, "utf8");
  const issues: string[] = [];
  const pattern = /\bCREATE\s+(?:TEMP|TEMPORARY)\s+TABLE\b/giu;

  for (const match of sql.matchAll(pattern)) {
    const before = sql.slice(0, match.index);
    const line = before.split("\n").length;
    issues.push(
      `${relative(process.cwd(), path)}:${line}: D1 does not authorize CREATE TEMP TABLE in seed batches; use a regular staging table and drop it before the seed completes`,
    );
  }

  return issues;
}

it("keeps every JSON-shaped SQL seed literal valid", () => {
  const issues = listSqlFiles(join(process.cwd(), "seeds")).flatMap(inspectJsonLiterals);
  expect(issues, issues.join("\n")).toEqual([]);
});

it("keeps SQL seed batches compatible with D1 table authorization", () => {
  const issues = listSqlFiles(join(process.cwd(), "seeds")).flatMap(inspectD1Compatibility);
  expect(issues, issues.join("\n")).toEqual([]);
});
