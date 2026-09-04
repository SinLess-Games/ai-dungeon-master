import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Dices,
  Home,
  BookOpen,
  LogIn,
  LogOut,
  Swords,
  Users,
  Search,
  Moon,
  Settings,
} from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { signOut } from "@/lib/auth";
import logoAsset from "@/assets/logo.png.asset.json";
import headerBgAsset from "@/assets/header-bg.png.asset.json";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/campaigns", label: "Play", icon: Swords },
  { to: "/characters", label: "Characters", icon: Users },
  { to: "/dice", label: "Dice", icon: Dices },
  { to: "/wiki", label: "Wiki", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b-2 border-primary/40 bg-background shadow-2xl shadow-black/30">
        {/* Atmospheric header background */}
        <div className="relative h-28 sm:h-32">
          <img
            src={headerBgAsset.url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/85" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />

          <div className="relative mx-auto flex h-full max-w-7xl items-center gap-4 px-4">
            {/* Logo + title block */}
            <Link to="/" className="flex items-center gap-3 sm:gap-4">
              <img
                src={logoAsset.url}
                alt="The Endless Codex"
                className="h-12 w-12 rounded-md border border-primary/60 object-cover shadow-lg shadow-black/40 sm:h-16 sm:w-16"
              />
              <div className="hidden flex-col items-start sm:flex">
                <span className="font-display text-lg leading-none tracking-wide text-primary sm:text-xl">
                  THE ENDLESS
                </span>
                <span className="font-display text-lg leading-none tracking-wide text-primary sm:text-xl">
                  CODEX
                </span>
                <span className="mt-1 text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                  AI DM FOR D&D 3.5
                </span>
              </div>
            </Link>

            {/* Vertical rule */}
            <div className="hidden h-10 w-px bg-primary/40 sm:block" />

            {/* Edition tagline */}
            <div className="hidden flex-col items-start leading-none md:flex">
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">D20</span>
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">3.5E</span>
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">INFINITE STORIES</span>
            </div>

            {/* Navigation */}
            <nav className="ml-auto flex items-center gap-1 sm:gap-2">
              {NAV.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  activeProps={{
                    className:
                      "bg-primary/15 text-primary ring-1 ring-primary/70 shadow-[0_0_15px_-3px_rgba(217,169,77,0.35)]",
                  }}
                  className="flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-accent/60 hover:text-foreground sm:gap-2 sm:px-3 sm:text-sm"
                >
                  <Icon className="size-4 sm:size-[1.125rem]" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              ))}

              <span className="mx-1 hidden h-6 w-px bg-border/70 sm:block" />

              {/* Search input */}
              <div className="relative hidden items-center lg:flex">
                <Search className="absolute left-2.5 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-8 w-40 rounded-md border border-border/60 bg-background/80 pl-8 pr-10 text-xs text-foreground placeholder:text-muted-foreground backdrop-blur focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/60 xl:w-52"
                />
                <kbd className="absolute right-2 hidden rounded border border-border/60 bg-muted/50 px-1 py-0.5 text-[0.6rem] text-muted-foreground xl:inline">
                  ⌘K
                </kbd>
              </div>

              {/* Theme / settings placeholders */}
              <button
                type="button"
                aria-label="Toggle theme"
                className="hidden items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground lg:flex"
              >
                <Moon className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Settings"
                className="hidden items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground lg:flex"
              >
                <Settings className="size-4" />
              </button>

              <span className="mx-1 hidden h-6 w-px bg-border/70 sm:block" />

              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end leading-none">
                    <span className="hidden max-w-[8rem] truncate text-xs text-foreground sm:inline">
                      {user.displayName}
                    </span>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="mt-0.5 text-[0.65rem] text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                    >
                      Sign out
                    </button>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-xs font-display text-primary shadow-md sm:h-9 sm:w-9">
                    {user.displayName?.slice(0, 1).toUpperCase() ?? "U"}
                  </div>
                </div>
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
