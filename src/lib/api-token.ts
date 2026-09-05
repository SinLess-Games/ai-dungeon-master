import { supabase } from "@/integrations/supabase/client";

/**
 * Bearer header for protected raw API routes (/api/chat, /api/generate-map).
 * Server-function RPCs get this automatically from the client middleware.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
