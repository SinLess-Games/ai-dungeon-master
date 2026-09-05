import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn, signInWithGoogle, signUp } from "@/lib/auth";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account | The Endless Codex" },
      {
        name: "description",
        content:
          "Sign in to The Endless Codex to save your D&D 3.5 characters, campaigns, and dice history, or create a free account for solo play.",
      },
      { property: "og:title", content: "Sign in or create an account | The Endless Codex" },
      {
        property: "og:description",
        content: "Create a free The Endless Codex account to save characters and campaigns for D&D 3.5 solo play.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://endless-codex.sinlessindustries.com/auth" },
    ],
    links: [{ rel: "canonical", href: "https://endless-codex.sinlessindustries.com/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") await signUp({ email, password, displayName });
      else await signIn(email, password);
      navigate({ to: "/characters" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageTitle
        title={mode === "signin" ? "Welcome back" : "Create your account"}
        subtitle="Your account keeps characters, campaigns, and dice history together. Solo play is free."
      />

      {user ? (
        <Card className="card-etched mx-auto max-w-md bg-card/70">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Signed in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You are signed in as <span className="text-foreground">{user.displayName}</span>.
            </p>
            <Button asChild>
              <Link to="/characters">Go to your characters</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-etched mx-auto max-w-md bg-card/70">
          <CardHeader>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={mode === "signin" ? "default" : "outline"}
                onClick={() => setMode("signin")}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                variant={mode === "signup" ? "default" : "outline"}
                onClick={() => setMode("signup")}
              >
                Sign up
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              {mode === "signup" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Thorin the Bold"
                    autoComplete="nickname"
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                {mode === "signup" ? (
                  <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                ) : null}
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>

              <div className="relative py-1 text-center text-xs text-muted-foreground">
                <span className="bg-card px-2">or</span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={busy}
                onClick={async () => {
                  setError(null);
                  setBusy(true);
                  try {
                    const result = await signInWithGoogle();
                    if (result) navigate({ to: "/characters" });
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Google sign-in failed.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Continue with Google
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
