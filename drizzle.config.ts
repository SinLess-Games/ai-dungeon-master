import { defineConfig } from "drizzle-kit";

const accountId = process.env["CLOUDFLARE_ACCOUNT_ID"];
const databaseId =
  process.env["CLOUDFLARE_DATABASE_ID"] ??
  "dc744f5a-7c53-4d37-b695-97b2527ef06a";
const token = process.env["CLOUDFLARE_D1_TOKEN"];

export default defineConfig({
  schema: "./src/infrastructure/database/schema/index.ts",

  out: "./drizzle",

  dialect: "sqlite",

  driver: "d1-http",

  dbCredentials: {
    accountId: accountId!,
    databaseId,
    token: token!,
  },

  breakpoints: true,

  verbose: true,

  strict: true,
});