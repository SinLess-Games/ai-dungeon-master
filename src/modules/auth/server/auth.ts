import { betterAuth, APIError } from "better-auth";
import { admin, username } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDatabase } from "@/infrastructure/database/client";
import * as schema from "@/infrastructure/database/schema/auth";
import { usernameSchema } from "../domain/validation";

export interface AuthEnv {
  DB?: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  SEED_ADMIN_EMAIL?: string;
  SEED_ADMIN_USERNAME?: string;
  SEED_ADMIN_PASSWORD?: string;
}
export function authOptions(env: AuthEnv) {
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32)
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
  if (!env.BETTER_AUTH_URL) throw new Error("BETTER_AUTH_URL must be configured.");
  const url = new URL(env.BETTER_AUTH_URL);
  if (
    url.origin !== env.BETTER_AUTH_URL ||
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
  )
    throw new Error("BETTER_AUTH_URL must be an HTTPS origin (HTTP is allowed on localhost only).");
  return {
    appName: "Endless Codex",
    baseURL: url.origin,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [url.origin],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    // Persistent rate limiting works across Worker isolates. Never trust proxy headers from clients.
    rateLimit: { enabled: true, storage: "database" as const, window: 60, max: 60 },
    advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
    account: {
      accountLinking: {
        enabled: true,
        requireLocalEmailVerified: true,
        allowDifferentEmails: false,
      },
    },
    socialProviders: {
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
        : {}),
      ...(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET
        ? { discord: { clientId: env.DISCORD_CLIENT_ID, clientSecret: env.DISCORD_CLIENT_SECRET } }
        : {}),
    },
    plugins: [
      admin({ defaultRole: "user", adminRoles: ["admin"] }),
      username({
        minUsernameLength: 3,
        maxUsernameLength: 32,
        usernameNormalization: (value: string) => value.trim().toLowerCase(),
        displayUsernameNormalization: (value: string) => value.trim(),
        usernameValidator: (value: string) => usernameSchema.safeParse(value).success,
        displayUsernameValidator: (value: string) => usernameSchema.safeParse(value).success,
        validationOrder: {
          username: "post-normalization" as const,
          displayUsername: "post-normalization" as const,
        },
      }),
    ] satisfies [ReturnType<typeof admin>, ReturnType<typeof username>],
    databaseHooks: {
      user: {
        create: {
          before: async (user: { name: string }, context: { path?: string } | null) => {
            if (
              context?.path === "/sign-up/email" &&
              !usernameSchema.safeParse((user as { username?: string }).username).success
            )
              throw new APIError("BAD_REQUEST", { message: "A valid username is required." });
            return { data: user };
          },
        },
      },
    },
  };
}
export function createAuth(env: AuthEnv) {
  if (!env.DB) throw new Error("D1 DB binding is required for authentication.");
  return betterAuth({
    ...authOptions(env),
    database: drizzleAdapter(createDatabase(env.DB), {
      provider: "sqlite",
      usePlural: true,
      schema,
    }),
  });
}
export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth["$Infer"]["Session"];
