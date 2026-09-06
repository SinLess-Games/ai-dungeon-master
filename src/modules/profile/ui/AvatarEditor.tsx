import { useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { authClient } from "@/modules/auth/client/authClient";

// Persist a small, re-encoded thumbnail in the existing profile image field.
async function thumbnail(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)
    throw new Error("Choose a PNG, JPEG, or WebP image smaller than 5 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 192;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");
    const side = Math.min(bitmap.width, bitmap.height);
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      192,
      192,
    );
    const result = canvas.toDataURL("image/webp", 0.75);
    if (!result.startsWith("data:image/webp;base64,") || result.length > 32768)
      throw new Error("This image is too detailed. Try a smaller or simpler picture.");
    return result;
  } finally {
    bitmap.close();
  }
}

export function AvatarEditor({ image }: { image: string | null | undefined }) {
  const session = authClient.useSession();
  const [draft, setDraft] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const lock = useRef(false);
  const shown = draft === undefined ? image : draft;
  async function choose(file: File) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      setDraft(await thumbnail(file));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to read this image.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function save() {
    if (lock.current || draft === undefined) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const result = await authClient.updateUser({ image: draft });
      if (result.error) throw new Error("Unable to save your picture. Please try again.");
      await session.refetch();
      setDraft(undefined);
      setSuccess(true);
    } catch {
      setError("Unable to save your picture. Please try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="profile-picture">
      <div className="profile-avatar">
        {shown ? (
          <img src={shown} alt="Your profile picture" referrerPolicy="no-referrer" />
        ) : (
          <UserRound size={48} />
        )}
      </div>
      <label className="profile-upload">
        Choose picture
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          aria-label="Choose profile picture"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void choose(file);
          }}
        />
      </label>
      <p className="profile-help">
        PNG, JPEG, or WebP · up to 5 MB.
        <br />
        Pictures are cropped to a square.
      </p>
      {shown && (
        <button
          type="button"
          className="profile-secondary"
          disabled={busy}
          onClick={() => {
            setDraft(null);
            setSuccess(false);
          }}
        >
          Remove picture
        </button>
      )}
      {draft !== undefined && (
        <div className="profile-actions">
          <button type="button" disabled={busy} onClick={() => void save()}>
            Save picture
          </button>
          <button
            type="button"
            className="profile-secondary"
            disabled={busy}
            onClick={() => {
              setDraft(undefined);
              setError("");
            }}
          >
            Cancel
          </button>
        </div>
      )}
      {busy && <p role="status">Updating picture…</p>}
      {error && (
        <p role="alert" className="profile-error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="profile-success">
          Picture saved.
        </p>
      )}
    </div>
  );
}
