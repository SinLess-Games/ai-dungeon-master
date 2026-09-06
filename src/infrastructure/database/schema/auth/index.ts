import { relations } from "drizzle-orm";
import { users } from "./user";
import { sessions } from "./session";
import { accounts } from "./account";

export * from "./user";
export * from "./session";
export * from "./account";
export * from "./verification";

// Drizzle 0.45 relations API; centralized here to keep table imports acyclic.
// Pass this whole barrel with usePlural: true to Better Auth's Drizzle adapter.
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}));
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));
export * from "./rate-limit";
