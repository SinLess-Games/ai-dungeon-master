import { Link } from "@tanstack/react-router";
import { Fragment, type ReactNode } from "react";
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
      <header className="sticky top-0 z-40 shadow-2xl shadow-black/30">
        {/* Atmospheric banner: castle art with logo block on the left */}
        <div className="relative h-24 overflow-hidden border-b-2 border-primary/50 sm:h-28">
          <img
            src={headerBgAsset.url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />

          <div className="relative mx-auto flex h-full max-w-7xl items-center gap-4 px-4">
            {/* Logo + title block */}
            <Link to="/" className="flex items-center gap-3 sm:gap-4">
              <img
                src={logoAsset.url}
                alt="The Endless Codex"
                className="h-14 w-14 rounded-md border-2 border-primary/70 object-cover shadow-lg shadow-black/60 sm:h-[4.5rem] sm:w-[4.5rem]"
              />
              <div className="hidden flex-col items-start sm:flex">
                <span className="font-display text-xl leading-tight tracking-wide text-primary sm:text-2xl">
                  THE ENDLESS
                </span>
                <span className="font-display text-xl leading-tight tracking-wide text-primary sm:text-2xl">
                  CODEX
                </span>
                <span className="mt-1.5 text-[0.6rem] uppercase tracking-[0.35em] text-muted-foreground">
                  AI DM FOR D&D 3.5
                </span>
              </div>
            </Link>

            {/* Vertical rule */}
            <div className="hidden h-12 w-px bg-primary/40 sm:block" />

            {/* Edition tagline */}
            <div className="hidden flex-col items-start gap-1 leading-none md:flex">
              <span className="text-[0.6rem] uppercase tracking-[0.35em] text-muted-foreground">D20</span>
              <span className="text-[0.6rem] uppercase tracking-[0.35em] text-muted-foreground">3.5E</span>
              <span className="text-[0.6rem] uppercase tracking-[0.35em] text-muted-foreground">INFINITE STORIES</span>
            </div>
          </div>
        </div>

        {/* Navigation row */}
        <div className="border-b border-border/60 bg-card/95 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 sm:gap-2">
            {NAV.map(({ to, label, icon: Icon }, i) => (
              <Fragment key={to}>
                {i > 0 && <span className="mx-1 hidden h-5 w-px bg-border/70 sm:block" />}
                <Link
                  to={to}
                  activeOptions={{ exact: to === "/" }}
                  activeProps={{
                    className:
                      "border border-primary/70 bg-primary/15 text-primary shadow-[0_0_18px_-4px_rgba(217,169,77,0.5)]",
                  }}
                  className="flex items-center gap-1.5 rounded-md border border-transparent px-2.5 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-accent/60 hover:text-foreground sm:gap-2 sm:px-3.5 sm:text-sm"
                >
                  <Icon className="size-4 sm:size-[1.125rem]" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              </Fragment>
            ))}

            <span className="mx-1 hidden h-5 w-px bg-border/70 sm:block" />

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

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
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

              <span className="mx-1 hidden h-5 w-px bg-border/70 sm:block" />

              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-xs font-display text-primary shadow-md sm:h-9 sm:w-9">
                    {user.displayName?.slice(0, 1).toUpperCase() ?? "U"}
                  </div>
                  <div className="flex flex-col items-start leading-none">
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
            </div>
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
