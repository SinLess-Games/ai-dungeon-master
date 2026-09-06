import { useState, useRef, type FormEvent } from "react";
import { api, checked } from "../client/queries";
export function ImageUploader({ postId, uploaded }: { postId: string; uploaded: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const input = new FormData(form);
    const file = input.get("file");
    if (
      !(file instanceof File) ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Choose a PNG, JPEG, or WebP image up to 5 MB.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const bitmap = await createImageBitmap(file);
      const width = bitmap.width;
      const height = bitmap.height;
      bitmap.close();
      if (width > 20000 || height > 20000)
        throw new Error("Image dimensions must be below 20,000 pixels.");
      await checked(
        await api.api.admin.devblog.posts[":id"].media.$post({
          param: { id: postId },
          form: {
            file,
            alt: String(input.get("alt")),
            width: String(width),
            height: String(height),
          },
        }),
      );
      form.reset();
      uploaded();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to upload image.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <form className="blog-form blog-upload" onSubmit={(event) => void submit(event)}>
      <h3>Upload an image</h3>
      <fieldset disabled={busy}>
        <label htmlFor="blog-image">Image (PNG, JPEG, WebP · up to 5 MB)</label>
        <input
          id="blog-image"
          name="file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
        />
        <label htmlFor="blog-alt">Alt text</label>
        <input
          id="blog-alt"
          name="alt"
          required
          maxLength={300}
          placeholder="Describe the image for readers who cannot see it"
        />
        <button type="submit">{busy ? "Uploading…" : "Upload image"}</button>
      </fieldset>
      {error && (
        <p role="alert" className="blog-error">
          {error}
        </p>
      )}
    </form>
  );
}
