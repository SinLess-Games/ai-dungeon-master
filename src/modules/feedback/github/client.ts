/// <reference types="@cloudflare/workers-types" />

import type { GitHubFeedbackEnv, GitHubIssueSnapshot } from "./types";

const GITHUB_API = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const USER_AGENT = "The-Endless-Codex-Feedback-Sync";
const encoder = new TextEncoder();

interface InstallationTokenResponse {
  token: string;
  expires_at: string;
}

interface RepositoryInstallationResponse {
  id: number;
}

interface LabelDefinition {
  name: string;
  color: string;
  description: string;
}

interface TokenCacheEntry {
  cacheKey: string;
  token: string;
  expiresAt: number;
}

let installationTokenCache: TokenCacheEntry | undefined;

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function derLength(length: number): Uint8Array {
  if (length < 0x80) return new Uint8Array([length]);
  const bytes: number[] = [];
  let value = length;
  while (value > 0) {
    bytes.unshift(value & 0xff);
    value >>>= 8;
  }
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function der(tag: number, payload: Uint8Array): Uint8Array {
  return concatBytes(new Uint8Array([tag]), derLength(payload.length), payload);
}

function decodePemBody(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  if (!body) throw new Error("GITHUB_APP_PRIVATE_KEY is empty or malformed.");
  const decoded = atob(body);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes;
}

/** Convert the PKCS#1 key GitHub commonly downloads into PKCS#8 for WebCrypto. */
function privateKeyToPkcs8(pem: string): Uint8Array {
  const decoded = decodePemBody(pem);
  if (!pem.includes("BEGIN RSA PRIVATE KEY")) return decoded;

  const version = new Uint8Array([0x02, 0x01, 0x00]);
  const rsaAlgorithmIdentifier = new Uint8Array([
    0x30,
    0x0d,
    0x06,
    0x09,
    0x2a,
    0x86,
    0x48,
    0x86,
    0xf7,
    0x0d,
    0x01,
    0x01,
    0x01,
    0x05,
    0x00,
  ]);
  const privateKeyOctetString = der(0x04, decoded);
  return der(0x30, concatBytes(version, rsaAlgorithmIdentifier, privateKeyOctetString));
}

function base64Url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? encoder.encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

async function createAppJwt(env: GitHubFeedbackEnv): Promise<string> {
  const appId = env.GITHUB_APP_ID?.trim();
  const privateKey = env.GITHUB_APP_PRIVATE_KEY?.trim();
  if (!appId) throw new Error("GITHUB_APP_ID is not configured.");
  if (!privateKey) throw new Error("GITHUB_APP_PRIVATE_KEY is not configured.");

  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyToPkcs8(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iat: now - 60,
      exp: now + 9 * 60,
      iss: appId,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(unsigned),
  );
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

function githubHeaders(authorization: string, extras?: HeadersInit): Headers {
  const headers = new Headers(extras);
  headers.set("Accept", "application/vnd.github+json");
  headers.set("Authorization", authorization);
  headers.set("User-Agent", USER_AGENT);
  headers.set("X-GitHub-Api-Version", GITHUB_API_VERSION);
  return headers;
}

async function errorFromResponse(response: Response): Promise<Error> {
  const body = (await response.text().catch(() => "")).slice(0, 1200);
  return new Error(`GitHub API ${response.status} ${response.statusText}${body ? `: ${body}` : ""}`);
}

function requireRepository(env: GitHubFeedbackEnv): string {
  const repository = env.GITHUB_REPOSITORY?.trim();
  if (!repository || !/^[^/]+\/[^/]+$/.test(repository)) {
    throw new Error("GITHUB_REPOSITORY must be configured as owner/repository.");
  }
  return repository;
}

async function resolveInstallationId(env: GitHubFeedbackEnv, appJwt: string): Promise<number> {
  const configured = env.GITHUB_INSTALLATION_ID?.trim();
  if (configured) {
    const value = Number(configured);
    if (Number.isSafeInteger(value) && value > 0) return value;
    throw new Error("GITHUB_INSTALLATION_ID must be a positive integer when configured.");
  }

  const repository = requireRepository(env);
  const response = await fetch(`${GITHUB_API}/repos/${repository}/installation`, {
    headers: githubHeaders(`Bearer ${appJwt}`),
  });
  if (!response.ok) throw await errorFromResponse(response);
  const data = (await response.json()) as RepositoryInstallationResponse;
  if (!Number.isSafeInteger(data.id) || data.id <= 0) {
    throw new Error("GitHub did not return a valid installation ID for the configured repository.");
  }
  return data.id;
}

async function getInstallationToken(env: GitHubFeedbackEnv): Promise<string> {
  const repository = requireRepository(env);
  const appId = env.GITHUB_APP_ID?.trim();
  if (!appId) throw new Error("GITHUB_APP_ID is not configured.");
  const cacheKey = `${appId}:${env.GITHUB_INSTALLATION_ID ?? "auto"}:${repository}`;
  if (
    installationTokenCache?.cacheKey === cacheKey &&
    installationTokenCache.expiresAt - Date.now() > 5 * 60_000
  ) {
    return installationTokenCache.token;
  }

  const appJwt = await createAppJwt(env);
  const installationId = await resolveInstallationId(env, appJwt);
  const response = await fetch(`${GITHUB_API}/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: githubHeaders(`Bearer ${appJwt}`, { "Content-Type": "application/json" }),
    body: "{}",
  });
  if (!response.ok) throw await errorFromResponse(response);
  const data = (await response.json()) as InstallationTokenResponse;
  if (!data.token || !data.expires_at) throw new Error("GitHub returned an invalid installation token.");

  installationTokenCache = {
    cacheKey,
    token: data.token,
    expiresAt: Date.parse(data.expires_at),
  };
  return data.token;
}

export async function githubRequest(
  env: GitHubFeedbackEnv,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getInstallationToken(env);
  const headers = githubHeaders(`Bearer ${token}`, init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${GITHUB_API}${path}`, { ...init, headers });
}

export async function getGitHubIssue(
  env: GitHubFeedbackEnv,
  repositoryFullName: string,
  issueNumber: number,
): Promise<GitHubIssueSnapshot> {
  const response = await githubRequest(
    env,
    `/repos/${repositoryFullName}/issues/${issueNumber}`,
  );
  if (!response.ok) throw await errorFromResponse(response);
  return (await response.json()) as GitHubIssueSnapshot;
}

export async function createGitHubIssue(
  env: GitHubFeedbackEnv,
  input: { title: string; body: string; labels: string[] },
): Promise<GitHubIssueSnapshot> {
  const repository = requireRepository(env);
  const response = await githubRequest(env, `/repos/${repository}/issues`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await errorFromResponse(response);
  return (await response.json()) as GitHubIssueSnapshot;
}

export async function updateGitHubIssue(
  env: GitHubFeedbackEnv,
  repositoryFullName: string,
  issueNumber: number,
  input: { state?: "open" | "closed"; labels?: string[] },
): Promise<GitHubIssueSnapshot> {
  const response = await githubRequest(
    env,
    `/repos/${repositoryFullName}/issues/${issueNumber}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  if (!response.ok) throw await errorFromResponse(response);
  return (await response.json()) as GitHubIssueSnapshot;
}

export async function ensureGitHubLabel(
  env: GitHubFeedbackEnv,
  definition: LabelDefinition,
): Promise<void> {
  const repository = requireRepository(env);
  const encodedName = encodeURIComponent(definition.name);
  const existing = await githubRequest(env, `/repos/${repository}/labels/${encodedName}`);
  if (existing.ok) return;
  if (existing.status !== 404) throw await errorFromResponse(existing);

  const created = await githubRequest(env, `/repos/${repository}/labels`, {
    method: "POST",
    body: JSON.stringify(definition),
  });
  if (!created.ok && created.status !== 422) throw await errorFromResponse(created);
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]{64}$/i.test(hex)) return null;
  const output = new Uint8Array(hex.length / 2);
  for (let index = 0; index < output.length; index += 1) {
    output[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return output;
}

export async function verifyGitHubWebhookSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string | undefined,
): Promise<boolean> {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const signature = hexToBytes(signatureHeader.slice("sha256=".length));
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify("HMAC", key, signature, encoder.encode(rawBody));
}
