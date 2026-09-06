import { ForbiddenError, UnauthorizedError } from "@/server/middleware/errors";
import type { Auth, AuthSession } from "./auth";
export function assertUser(session: AuthSession | null): AuthSession {
  if (!session) throw new UnauthorizedError("Sign in to continue.");
  return session;
}
export function assertAdmin(session: AuthSession | null): AuthSession {
  const authenticated = assertUser(session);
  if (authenticated.user.role !== "admin")
    throw new ForbiddenError("Administrator access is required.");
  return authenticated;
}
export async function requireUser(auth: Auth, headers: Headers) {
  return assertUser(await auth.api.getSession({ headers, query: { disableCookieCache: true } }));
}
export async function requireAdmin(auth: Auth, headers: Headers) {
  return assertAdmin(await auth.api.getSession({ headers, query: { disableCookieCache: true } }));
}
