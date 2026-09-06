import { useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Check, ShieldCheck } from "lucide-react";
import { authClient } from "@/modules/auth/client/authClient";
import { authError } from "@/modules/auth/client/queries";
import { usernameSchema } from "@/modules/auth/domain/validation";
import { useAuthModal } from "@/shared/stores/authModal.store";
import "./profile.css";
import { AvatarEditor } from "./AvatarEditor";
import { PasswordForm } from "./PasswordForm";

type ProfileUser = typeof authClient.$Infer.Session.user;

export function ProfilePage() {
  const session = authClient.useSession();
  if (session.isPending)
    return (
      <main className="profile-page">
        <p role="status">Loading your profile…</p>
      </main>
    );
  if (session.error)
    return (
      <main className="profile-page">
        <h1>Unable to load your profile</h1>
        <button onClick={() => void session.refetch()}>Try again</button>
      </main>
    );
  if (!session.data)
    return (
      <main className="profile-page profile-access">
        <BookOpen size={42} />
        <h1>Your story starts here</h1>
        <p>Sign in to view and edit your adventurer profile.</p>
        <button onClick={useAuthModal.getState().openLogin}>Sign in to your account</button>
        <Link to="/">Back to Home</Link>
      </main>
    );
  return <ProfileDetails key={session.data.user.id} user={session.data.user} />;
}

function ProfileDetails({ user }: { user: ProfileUser }) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.displayUsername || user.username || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const submitting = useRef(false);
  const baseline = useRef({
    name: user.name,
    username: user.displayUsername || user.username || "",
  });
  const dirty =
    name.trim() !== baseline.current.name || username.trim() !== baseline.current.username;
  const identity = user.displayUsername || user.username || user.name;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !dirty) return;
    setError("");
    setSaved(false);
    if (!name.trim() || name.trim().length > 80) {
      setError("Enter a display name between 1 and 80 characters.");
      return;
    }
    if (!usernameSchema.safeParse(username.trim()).success) {
      setError("Choose a username with 3–32 letters, numbers, underscores, or hyphens.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const values = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        displayUsername: username.trim(),
      };
      const result = await authClient.updateUser(values);
      if (result.error) {
        setError(authError(result.error, "Unable to save your profile. Please try again."));
        return;
      }
      baseline.current = { name: values.name, username: values.displayUsername };
      setName(values.name);
      setUsername(values.displayUsername);
      setSaved(true);
    } catch {
      setError("Unable to save your profile. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="profile-page">
      <div className="profile-container">
        <Link to="/" className="profile-back">
          ← Back to Home
        </Link>
        <header className="profile-heading">
          <span>THE ENDLESS CODEX</span>
          <h1>Your adventurer profile</h1>
          <p>The identity behind every story you tell.</p>
        </header>
        <div className="profile-grid">
          <aside className="profile-identity">
            <AvatarEditor image={user.image} />
            <h2>{user.name}</h2>
            <p>@{identity}</p>
            <span className="profile-badge">
              <ShieldCheck size={15} />
              {user.role === "admin" ? "Administrator" : "Adventurer"}
            </span>
            <div className="profile-member">
              <BookOpen size={20} />
              <span>
                Member since
                <time dateTime={new Date(user.createdAt).toISOString()}>
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </span>
            </div>
          </aside>
          <div className="profile-sections">
            <section className="profile-panel" aria-labelledby="profile-details-title">
              <h2 id="profile-details-title">Profile details</h2>
              <p>Choose how you appear in the Codex.</p>
              <form onSubmit={(event) => void save(event)}>
                <fieldset disabled={busy}>
                  <label htmlFor="profile-name">Display name</label>
                  <input
                    id="profile-name"
                    autoComplete="nickname"
                    value={name}
                    required
                    maxLength={80}
                    onChange={(event) => {
                      setName(event.target.value);
                      setSaved(false);
                    }}
                  />
                  <label htmlFor="profile-username">Username</label>
                  <input
                    id="profile-username"
                    autoComplete="username"
                    value={username}
                    required
                    minLength={3}
                    maxLength={32}
                    aria-describedby="profile-username-help"
                    onChange={(event) => {
                      setUsername(event.target.value);
                      setSaved(false);
                    }}
                  />
                  <p id="profile-username-help" className="profile-help">
                    3–32 letters, numbers, underscores, or hyphens. You can use this to sign in.
                  </p>
                  <label htmlFor="profile-email">Email address</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={user.email}
                    readOnly
                    aria-describedby="profile-email-help"
                  />
                  <p id="profile-email-help" className="profile-help">
                    Email changes are not available yet. Your email is private.
                  </p>
                </fieldset>
                {error && (
                  <p className="profile-error" role="alert">
                    {error}
                  </p>
                )}
                {saved && (
                  <p className="profile-success" role="status">
                    <Check size={17} />
                    Profile saved.
                  </p>
                )}
                <div className="profile-actions">
                  <button type="submit" disabled={busy || !dirty}>
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    className="profile-secondary"
                    disabled={busy || !dirty}
                    onClick={() => {
                      setName(baseline.current.name);
                      setUsername(baseline.current.username);
                      setError("");
                      setSaved(false);
                    }}
                  >
                    Discard changes
                  </button>
                </div>
              </form>
            </section>
            <PasswordForm />
          </div>
        </div>
      </div>
    </main>
  );
}
