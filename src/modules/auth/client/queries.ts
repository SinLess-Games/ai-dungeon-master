import type { QueryClient } from "@tanstack/react-query";
import { authClient } from "./authClient";
/** Private queries use meta.requiresAuth. Clear them across identity changes. */
export async function refreshIdentity(queryClient: QueryClient) {
  await queryClient.cancelQueries({ predicate: (query) => query.meta?.["requiresAuth"] === true });
  queryClient.removeQueries({ predicate: (query) => query.meta?.["requiresAuth"] === true });
  await authClient.getSession({ fetchOptions: { cache: "no-store" } });
}
export function authError(
  error: { code?: string | undefined; message?: string | undefined } | null,
  fallback: string,
) {
  const messages: Record<string, string> = {
    INVALID_EMAIL_OR_PASSWORD: "Invalid email or password.",
    INVALID_USERNAME_OR_PASSWORD: "Invalid username or password.",
    USER_ALREADY_EXISTS: "That email is already registered.",
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "That email is already registered.",
    USERNAME_IS_ALREADY_TAKEN: "That username is unavailable.",
    USERNAME_ALREADY_EXISTS: "That username is unavailable.",
    USER_BANNED: "This account is suspended.",
    TOO_MANY_REQUESTS: "Too many attempts. Please wait and try again.",
  };
  return (error?.code && messages[error.code]) || fallback;
}
