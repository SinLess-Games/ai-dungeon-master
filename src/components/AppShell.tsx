import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Dices, Scroll, Users, BookOpen, LogIn, LogOut, Swords } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { signOut } from "@/lib/auth";
import logoAsset from "@/assets/logo.png.asset.json";

const NAV = [
  { to: "/", label: "Table", icon: Scroll },
  { to: "/campaigns", label: "Play", icon: Swords },
  { to: "/characters", label: "Characters", icon: Users },
  { to: "/dice", label: "Dice", icon: Dices },
  { to: "/wiki", label: "Wiki", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logoAsset.url}
              alt="The Endless Codex"
              className="h-10 w-10 rounded-md border border-border/60 object-cover"
            />
            <span className="font-display text-lg tracking-wide text-primary">THE ENDLESS CODEX</span>
            <span className="hidden text-xs uppercase tracking-[0.3em] text-muted-foreground sm:inline">
              d20 · 3.5e
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
            <span className="mx-1 h-6 w-px bg-border/70" />
            {user ? (
              <>
                <span className="hidden max-w-[10rem] truncate text-sm text-muted-foreground sm:inline">
                  {user.displayName}
                </span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary transition-colors hover:bg-accent/60"
              >
                <LogIn className="size-4" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-xs text-muted-foreground">
        Built on the d20 System Reference Document. Solo play is free.
      </footer>
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="rune-rule mt-5" />
    </div>
  );
}
