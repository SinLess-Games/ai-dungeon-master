/**
 * Local account layer.
 *
 * Deliberately a small, swappable API (signUp / signIn / signOut / getSession)
 * so it can be replaced by Lovable Cloud auth without touching the UI.
 * Passwords are never stored in plain text: we keep a PBKDF2-SHA256 hash with
 * a per-account random salt in local storage.
 */

const KEY_USERS = "dnd35:users";
const KEY_SESSION = "dnd35:session";

export interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  salt: string;
  hash: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
}

export const AUTH_EVENT = "dnd35:auth-changed";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string, saltHex: string) {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(saltHex.match(/.{2}/g) ?? [], (h) => parseInt(h, 16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 150_000, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(bits);
}

function newSalt() {
  return toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

function listUsers(): StoredUser[] {
  return read<StoredUser[]>(KEY_USERS, []);
}

function publicUser(u: StoredUser): SessionUser {
  return { id: u.id, email: u.email, displayName: u.displayName };
}

export function getSession(): SessionUser | null {
  return read<SessionUser | null>(KEY_SESSION, null);
}

export async function signUp(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<SessionUser> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (input.password.length < 8) throw new Error("Password must be at least 8 characters.");

  const users = listUsers();
  if (users.some((u) => u.email === email)) throw new Error("An account with that email already exists.");

  const salt = newSalt();
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email,
    displayName: input.displayName.trim() || email.split("@")[0]!,
    salt,
    hash: await hashPassword(input.password, salt),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  write(KEY_USERS, users);
  const session = publicUser(user);
  write(KEY_SESSION, session);
  return session;
}

export async function signIn(email: string, password: string): Promise<SessionUser> {
  const user = listUsers().find((u) => u.email === email.trim().toLowerCase());
  if (!user) throw new Error("No account found with that email.");
  const hash = await hashPassword(password, user.salt);
  if (hash !== user.hash) throw new Error("Incorrect password.");
  const session = publicUser(user);
  write(KEY_SESSION, session);
  return session;
}

export function signOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_SESSION);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = getSession();
  if (!session) throw new Error("You are not signed in.");
  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
  const users = listUsers();
  const i = users.findIndex((u) => u.id === session.id);
  const user = users[i];
  if (i < 0 || !user) throw new Error("Account not found.");
  if ((await hashPassword(currentPassword, user.salt)) !== user.hash) {
    throw new Error("Current password is incorrect.");
  }
  const salt = newSalt();
  users[i] = { ...user, salt, hash: await hashPassword(newPassword, salt) };
  write(KEY_USERS, users);
}
