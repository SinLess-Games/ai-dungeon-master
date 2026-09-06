import { eq } from "drizzle-orm";
import { users, accounts } from "@/infrastructure/database/schema/auth";
import { createDatabase } from "@/infrastructure/database/client";
import { createAuth, type AuthEnv } from "./auth";
import { passwordSchema, usernameSchema } from "../domain/validation";
import { z } from "zod";
/** Operator-only entry point: never mount this on an HTTP route. Existing passwords are preserved. */
export async function seedAdmin(env: AuthEnv) {
  if (!env.SEED_ADMIN_PASSWORD)
    throw Error("SEED_ADMIN_PASSWORD is required; no account was seeded.");
  passwordSchema.parse(env.SEED_ADMIN_PASSWORD);
  const email = z
    .email()
    .parse((env.SEED_ADMIN_EMAIL || "timothy.pierce444@gmail.com").trim().toLowerCase());
  const displayUsername = usernameSchema.parse(env.SEED_ADMIN_USERNAME || "Sinless777");
  const normalized = displayUsername.toLowerCase();
  if (!env.DB) throw Error("DB is required.");
  const db = createDatabase(env.DB);
  const existing = await db.select().from(users).where(eq(users.email, email)).get();
  const owner = await db.select().from(users).where(eq(users.username, normalized)).get();
  if (owner && owner.id !== existing?.id)
    throw Error(
      "The seed username belongs to another account. Resolve the conflict before seeding.",
    );
  const auth = createAuth(env);
  if (!existing) {
    // No request or headers: the installed Admin plugin permits this trusted server API call.
    await auth.api.createUser({
      body: {
        email,
        name: displayUsername,
        password: env.SEED_ADMIN_PASSWORD,
        role: "admin",
        data: { username: normalized, displayUsername },
      },
    });
  } else {
    const credential = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, existing.id))
      .all();
    if (!credential.some((account) => account.providerId === "credential" && account.password))
      throw Error(
        "Existing account has no password credential. Set one using Better Auth before seeding; no role was changed.",
      );
    // Operator-controlled metadata only. Credentials are never written by application code.
    await db
      .update(users)
      .set({ role: "admin", username: normalized, displayUsername })
      .where(eq(users.id, existing.id));
  }
  return { email, username: displayUsername, role: "admin" as const, created: !existing };
}
