import { createClient } from "@supabase/supabase-js";

/**
 * Verifies the Supabase bearer token on a raw server-route request.
 *
 * `createServerFn` RPCs get this from the `requireSupabaseAuth` middleware, but
 * `createFileRoute` server handlers have no middleware chain, so any protected
 * API route must call this explicitly before doing paid or privileged work.
 */
export async function requireApiUser(
  request: Request,
): Promise<{ userId: string } | { response: Response }> {
  const unauthorized = { response: new Response("Unauthorized", { status: 401 }) };

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    return { response: new Response("Auth is not configured", { status: 500 }) };
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return unauthorized;

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token || token.split(".").length !== 3) return unauthorized;

  const isNewKey = key.startsWith("sb_publishable_") || key.startsWith("sb_secret_");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (isNewKey && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) return unauthorized;
    return { userId: data.claims.sub };
  } catch {
    return unauthorized;
  }
}
