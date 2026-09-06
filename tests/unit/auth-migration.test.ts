import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { expect, it } from "vitest";
it("adds username support without deleting existing sessions or credential accounts", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("PRAGMA foreign_keys = ON");
    db.exec(readFileSync("drizzle/0002_better_auth.sql", "utf8"));
    db.exec("INSERT INTO users (id,name,email) VALUES ('u','Hero','hero@example.test')");
    db.exec(
      "INSERT INTO accounts (id,user_id,account_id,provider_id,issuer,updated_at) VALUES ('a','u','u','credential','local:credential',1)",
    );
    db.exec(
      "INSERT INTO sessions (id,user_id,token,expires_at,updated_at) VALUES ('s','u','test-session',9999999999999,1)",
    );
    db.exec(readFileSync("drizzle/0003_rainy_dracula.sql", "utf8"));
    expect(db.prepare("SELECT count(*) AS n FROM accounts").get()?.["n"]).toBe(1);
    expect(db.prepare("SELECT count(*) AS n FROM sessions").get()?.["n"]).toBe(1);
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    expect(() => db.exec("UPDATE users SET username='Hero'")).toThrow();
    db.exec("UPDATE users SET username='hero',display_username='Hero'");
    expect(() =>
      db.exec(
        "INSERT INTO users (id,name,email,username) VALUES ('v','Other','other@example.test','hero')",
      ),
    ).toThrow();
  } finally {
    db.close();
  }
});
