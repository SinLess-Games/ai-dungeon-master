import { supabase } from "@/integrations/supabase/client";

const BUCKET = "map-art";

function dataUrlToBlob(dataUrl: string) {
  const [head, body] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(head ?? "")?.[1] ?? "image/png";
  const bin = atob(body ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Store a generated map picture and return the storage path. */
export async function saveMapArt(kind: "world" | "site", id: string, dataUrl: string) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sign in to keep your maps.");
  const path = `${uid}/${kind}-${id}-${Date.now()}.png`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, dataUrlToBlob(dataUrl), { contentType: "image/png", upsert: true });
  if (error) throw new Error(error.message);
  return path;
}

const urlCache = new Map<string, string>();

/** A temporary viewing link for a stored map picture. */
export async function mapArtUrl(path: string) {
  const cached = urlCache.get(path);
  if (cached) return cached;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 12);
  if (error || !data?.signedUrl) return undefined;
  urlCache.set(path, data.signedUrl);
  return data.signedUrl;
}
