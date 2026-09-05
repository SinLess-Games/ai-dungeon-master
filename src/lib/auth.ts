/**
 * Account layer backed by Lovable Cloud auth.
 *
 * The UI reads the current user synchronously through `getSession()`, so we keep
 * a small in-memory + localStorage mirror of the signed-in profile that is kept
 * fresh by `startAuthListener()` (mounted once by `useSession`).
 */

import { supabase } from "@/integrations/supabase/client";

import { readProfile, writeProfile } from "@/lib/database.functions";

const KEY_SESSION = "codex:session-cache";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt?: string;
}

export const AUTH_EVENT = "codex:auth-changed";

let cached: SessionUser | null | undefined;

function readCache(): SessionUser | null {
  if (cached !== undefined) return cached;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY_SESSION);
    cached = raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    cached = null;
  }
  return cached;
}

function writeCache(user: SessionUser | null) {
  cached = user;
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(KEY_SESSION, JSON.stringify(user));
  else window.localStorage.removeItem(KEY_SESSION);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

/** Synchronous read of the last known signed-in user. */
export function getSession(): SessionUser | null {
  return readCache();
}

interface ProfileRow {
  display_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

async function loadProfile(userId: string, email: string): Promise<SessionUser> {
  const data = (await readProfile()) as ProfileRow | null;

  const user: SessionUser = {
    id: userId,
    email,
    displayName: data?.display_name || email.split("@")[0] || "Adventurer",
  };
  if (data?.avatar_url) user.avatarUrl = data.avatar_url;
  if (data?.created_at) user.createdAt = data.created_at;
  return user;
}

/** Refresh the cached profile from the server. */
export async function refreshSession(): Promise<SessionUser | null> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session?.user) {
    writeCache(null);
    return null;
  }
  const user = await loadProfile(session.user.id, session.user.email ?? "");
  writeCache(user);
  return user;
}

let listening = false;

/** Mounted once by useSession: keeps the cached profile in sync with auth state. */
export function startAuthListener() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      writeCache(null);
      return;
    }
    // Never await inside the auth callback; defer the profile read.
    setTimeout(() => {
      void loadProfile(session.user.id, session.user.email ?? "").then(writeCache);
    }, 0);
  });
  void refreshSession();
}

export async function signUp(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<SessionUser> {
  const displayName = input.displayName?.trim() || input.email.split("@")[0] || "Adventurer";
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: { display_name: displayName },
    },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Sign up failed.");
  if (!data.session) {
    throw new Error("Check your email to confirm your account, then sign in.");
  }
  const user = await loadProfile(data.user.id, data.user.email ?? input.email);
  writeCache(user);
  return user;
}

export async function signIn(email: string, password: string): Promise<SessionUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(error.message);
  const user = await loadProfile(data.user.id, data.user.email ?? email);
  writeCache(user);
  return user;
}

export async function signInWithGoogle() {
  const { lovable } = await import("@/integrations/lovable/index");
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (result.error) throw new Error(result.error.message ?? "Google sign-in failed.");
  if (result.redirected) return null;
  return refreshSession();
}

export function signOut() {
  writeCache(null);
  void supabase.auth.signOut();
}

export async function updateDisplayName(displayName: string): Promise<SessionUser> {
  const session = getSession();
  if (!session) throw new Error("You are not signed in.");
  const name = displayName.trim();
  if (name.length < 2) throw new Error("Display name must be at least 2 characters.");
  await writeProfile({ data: { display_name: name } });
  const next = { ...session, displayName: name };
  writeCache(next);
  return next;
}

/** Store (or clear) the account portrait. */
export async function updateAvatar(avatarUrl: string | null): Promise<SessionUser> {
  const session = getSession();
  if (!session) throw new Error("You are not signed in.");
  await writeProfile({ data: { avatar_url: avatarUrl } });
  const next: SessionUser = { ...session };
  if (avatarUrl) next.avatarUrl = avatarUrl;
  else delete next.avatarUrl;
  writeCache(next);
  return next;
}

export function getAccountCreatedAt(_userId: string): string | null {
  return getSession()?.createdAt ?? null;
}

export async function changePassword(_currentPassword: string, newPassword: string) {
  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}
