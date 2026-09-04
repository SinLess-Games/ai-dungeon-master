import { supabase } from "@/integrations/supabase/client";

const BUCKET = "blog-media";
const MAX_WIDTH = 1600;

/** Downscales and re-encodes an image so uploads stay light for the web. */
async function optimize(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/** Uploads an image for a blog post and returns the shareable URL to embed. */
export async function uploadBlogImage(file: File): Promise<string> {
  const blob = await optimize(file);
  const ext = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() || "png");
  const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw new Error(error.message);
  return `/api/public/blog-media/${path}`;
}
