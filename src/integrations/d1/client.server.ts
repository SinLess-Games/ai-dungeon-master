import { getRequest } from "@tanstack/react-start/server";
import { DatabaseClient, type AppDatabase } from "./query.server";

let localDatabase: Promise<AppDatabase> | undefined;

export async function getDatabase(request: Request = getRequest()): Promise<AppDatabase> {
  const db = (request as Request & { runtime?: { cloudflare?: { env?: { DB?: AppDatabase } } } })
    .runtime?.cloudflare?.env?.DB;
  if (!db && import.meta.env.DEV) {
    localDatabase ??= import("wrangler").then(async ({ getPlatformProxy }) => {
      const proxy = await getPlatformProxy<{ DB: AppDatabase }>({ configPath: "wrangler.toml" });
      return proxy.env.DB;
    });
    return localDatabase;
  }
  if (!db)
    throw new Error(
      "D1 binding DB is unavailable. Build and run npm run preview for the Workers runtime.",
    );
  return db;
}

export async function serviceDatabase(request?: Request) {
  return new DatabaseClient(await getDatabase(request), {
    userId: null,
    admin: false,
    service: true,
  });
}
export async function publicDatabase() {
  return new DatabaseClient(await getDatabase(), { userId: null, admin: false });
}
export async function userDatabase(userId: string) {
  const db = await getDatabase();
  const admin = Boolean(
    await db
      .prepare("SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'")
      .bind(userId)
      .first(),
  );
  return new DatabaseClient(db, { userId, admin });
}
