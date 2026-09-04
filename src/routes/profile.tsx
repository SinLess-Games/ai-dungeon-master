import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Dices,
  KeyRound,
  LogOut,
  ImagePlus,
  Pencil,
  Trash2,
  Scroll,
  Swords,
  UserRound,
} from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { useSession } from "@/hooks/useSession";
import {
  changePassword,
  getAccountCreatedAt,
  signOut,
  updateAvatar,
  updateDisplayName,
} from "@/lib/auth";
import { listCampaigns, listCharacters, listRolls } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — The Endless Codex" },
      {
        name: "description",
        content: "Manage your Endless Codex account, display name, password, and view your heroes, campaigns, and dice history.",
      },
      { property: "og:title", content: "Your Profile — The Endless Codex" },
      {
        property: "og:description",
        content: "Manage your Endless Codex account, heroes, campaigns, and dice history.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const navigate = useNavigate();

  const characters = useMemo(() => listCharacters(), []);
  const campaigns = useMemo(() => listCampaigns(), []);
  const rolls = useMemo(() => listRolls(), []);

  if (!user) {
    return (
      <AppShell>
        <PageTitle title="Profile" subtitle="Sign in to view your profile." />
        <div className="rounded-lg border border-border/60 bg-card p-8 text-center">
          <UserRound className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">You are not signed in.</p>
          <Link
            to="/auth"
            className="mt-4 inline-block rounded-md border border-primary/60 bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/20"
          >
            Go to sign in
          </Link>
        </div>
      </AppShell>
    );
  }

  const createdAt = getAccountCreatedAt(user.id);

  return (
    <AppShell>
      <PageTitle title="Your Profile" subtitle="Account details and your legend at the table." />

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        {/* Identity card */}
        <div className="space-y-6">
          <section className="rounded-lg border border-border/60 bg-card p-6 text-center">
            <PortraitPicker
              avatarUrl={user.avatarUrl ?? null}
              fallback={user.displayName.slice(0, 1).toUpperCase()}
            />

            <h2 className="mt-4 font-display text-xl text-foreground">{user.displayName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            {createdAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                Adventuring since {new Date(createdAt).toLocaleDateString()}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                signOut();
                void navigate({ to: "/" });
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-3 gap-3">
            {[
              { icon: Swords, label: "Heroes", value: characters.length },
              { icon: BookOpen, label: "Campaigns", value: campaigns.length },
              { icon: Dices, label: "Rolls", value: rolls.length },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-lg border border-border/60 bg-card p-3 text-center"
              >
                <Icon className="mx-auto size-4 text-primary" />
                <p className="mt-1 font-display text-xl text-foreground">{value}</p>
                <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </section>

          <DisplayNameForm current={user.displayName} />
          <PasswordForm />
        </div>

        {/* Activity */}
        <div className="space-y-6">
          <section className="rounded-lg border border-border/60 bg-card p-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg text-foreground">
                <Scroll className="size-4 text-primary" /> Your Heroes
              </h3>
              <Link to="/characters" className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>
            {characters.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No heroes yet.{" "}
                <Link to="/characters/new" className="text-primary hover:underline">
                  Create your first character
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border/50">
                {characters.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <Link
                      to="/characters/$id"
                      params={{ id: c.id }}
                      className="flex items-center justify-between py-2.5 hover:text-primary"
                    >
                      <span className="text-sm text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.classes.map((cl) => `${cl.classId} ${cl.levels}`).join(" / ")}
                        {c.gestalt && c.classesB?.length
                          ? ` // ${c.classesB.map((cl) => `${cl.classId} ${cl.levels}`).join(" / ")}`
                          : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border/60 bg-card p-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg text-foreground">
                <BookOpen className="size-4 text-primary" /> Your Campaigns
              </h3>
              <Link to="/campaigns" className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>
            {campaigns.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No campaigns yet.{" "}
                <Link to="/campaigns" className="text-primary hover:underline">
                  Start a new tale
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border/50">
                {campaigns.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <Link
                      to="/campaigns/$id"
                      params={{ id: c.id }}
                      className="flex items-center justify-between py-2.5 hover:text-primary"
                    >
                      <span className="text-sm text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.styles.join(", ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border/60 bg-card p-6">
            <h3 className="flex items-center gap-2 font-display text-lg text-foreground">
              <Dices className="size-4 text-primary" /> Recent Rolls
            </h3>
            {rolls.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No dice rolled yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border/50">
                {rolls.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-foreground">
                      {r.label ? `${r.label} — ` : ""}
                      <span className="font-mono text-xs text-muted-foreground">{r.notation}</span>
                    </span>
                    <span className="font-display text-primary">{r.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function DisplayNameForm({ current }: { current: string }) {
  const [name, setName] = useState(current);
  const [saving, setSaving] = useState(false);
  return (
    <section className="rounded-lg border border-border/60 bg-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Pencil className="size-4 text-primary" /> Display name
      </h3>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSaving(true);
          try {
            updateDisplayName(name);
            toast.success("Display name updated.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not update name.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 min-w-0 flex-1 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving || name.trim() === current}
          className="h-9 rounded-md border border-primary/60 bg-primary/10 px-3 text-xs text-primary hover:bg-primary/20 disabled:opacity-40"
        >
          Save
        </button>
      </form>
    </section>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="rounded-lg border border-border/60 bg-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
        <KeyRound className="size-4 text-primary" /> Change password
      </h3>
      <form
        className="mt-3 space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await changePassword(currentPassword, newPassword);
            setCurrentPassword("");
            setNewPassword("");
            toast.success("Password changed.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not change password.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          className="h-9 w-full rounded-md border border-border/60 bg-background px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (8+ characters)"
          className="h-9 w-full rounded-md border border-border/60 bg-background px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !currentPassword || newPassword.length < 8}
          className="h-9 w-full rounded-md border border-primary/60 bg-primary/10 text-xs text-primary hover:bg-primary/20 disabled:opacity-40"
        >
          Update password
        </button>
      </form>
    </section>
  );
}

/** Upload, preview, and remove the account portrait (stored locally as a data URL). */
function PortraitPicker({ avatarUrl, fallback }: { avatarUrl: string | null; fallback: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await resizeToDataUrl(file, 320);
      updateAvatar(dataUrl);
      toast.success("Portrait updated.");
    } catch {
      toast.error("Could not read that image.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Change portrait"
        className="group relative mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-primary/60 bg-primary/10 font-display text-3xl text-primary shadow-[0_0_24px_-6px_rgba(217,169,77,0.5)]"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Your portrait" className="h-full w-full object-cover" />
        ) : (
          fallback
        )}
        <span className="absolute inset-0 hidden items-center justify-center bg-background/70 text-xs text-primary group-hover:flex">
          <ImagePlus className="size-5" />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onPick(file);
        }}
      />
      <div className="mt-3 flex items-center gap-3 text-xs">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="text-primary hover:underline disabled:opacity-60"
        >
          {busy ? "Uploading…" : avatarUrl ? "Change portrait" : "Add portrait"}
        </button>
        {avatarUrl && (
          <button
            type="button"
            onClick={() => {
              updateAvatar(null);
              toast.success("Portrait removed.");
            }}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" /> Remove
          </button>
        )}
      </div>
    </div>
  );
}

/** Downscale an image file to a square-ish JPEG data URL so local storage stays small. */
function resizeToDataUrl(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
