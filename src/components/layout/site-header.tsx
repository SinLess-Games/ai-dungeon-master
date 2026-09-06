import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronDown,
  Dices,
  House,
  MessageSquare,
  Newspaper,
  Moon,
  Search,
  Settings,
  Sun,
  Swords,
  Users,
  X,
} from "lucide-react";
import { UserMenu } from "@/modules/auth/ui/UserMenu";
import logo from "@/assets/favicon.png";
import "./site-header.css";

const sections = [
  { label: "Campaigns", icon: Swords },
  { label: "Characters", icon: Users },
  { label: "Dice", icon: Dices },
  { label: "Wiki", icon: BookOpen },
];

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  const [panel, setPanel] = useState<"search" | "settings" | "account">("search");
  const [search, setSearch] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const playDropdown = useRef<HTMLDetailsElement>(null);

  function openPanel(next: typeof panel) {
    setPanel(next);
    setSearch("");
    dialog.current?.showModal();
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("codex-theme");
      if (saved === "dark" || saved === "light") {
        document.documentElement.classList.toggle("dark", saved === "dark");
        setDark(saved === "dark");
      }
    } catch {
      /* Theme still works when storage is unavailable. */
    }
    function closePlay(event: PointerEvent) {
      if (event.target instanceof Node && !playDropdown.current?.contains(event.target)) {
        playDropdown.current?.removeAttribute("open");
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && playDropdown.current?.open) {
        playDropdown.current.removeAttribute("open");
        playDropdown.current.querySelector("summary")?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPanel("search");
        setSearch("");
        dialog.current?.showModal();
        requestAnimationFrame(() => searchInput.current?.focus());
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", closePlay);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", closePlay);
    };
  }, []);

  useEffect(() => {
    if (panel === "search" && dialog.current?.open) searchInput.current?.focus();
  }, [panel]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("codex-theme", next ? "dark" : "light");
    } catch {
      /* Optional persistence. */
    }
  }

  const pages = [
    { name: "Home", description: "Welcome to Endless Codex", to: "/" as const },
    {
      name: "Service status",
      description: "Check the service availability",
      to: "/status" as const,
    },
  ].filter((page) =>
    `${page.name} ${page.description}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <header className="codex-header">
      <a href="#main-content" className="codex-skip">
        Skip to content
      </a>
      <div className="codex-toolbar">
        <div className="codex-toolbar-inner">
          <Link to="/" className="codex-brand" aria-label="Endless Codex home">
            <img src={logo} alt="" width={60} height={60} className="codex-logo" />
            <span className="codex-wordmark">
              <small>The</small>
              <span>Endless</span>
              <strong>Codex</strong>
            </span>
          </Link>
          <nav className="codex-nav" aria-label="Main navigation">
            <Link
              to="/"
              className={`codex-nav-item ${pathname === "/" ? "is-active" : ""}`}
              aria-current={pathname === "/" ? "page" : undefined}
            >
              <House aria-hidden="true" />
              <span>Home</span>
            </Link>
            <button
              type="button"
              className="codex-nav-item"
              aria-disabled="true"
              title="Devblog — coming soon"
            >
              <Newspaper aria-hidden="true" />
              <span>Devblog</span>
              <span className="sr-only"> (coming soon)</span>
            </button>
            <details ref={playDropdown} className="codex-play-dropdown">
              <summary className="codex-nav-item">
                <Swords aria-hidden="true" />
                <span>Play</span>
                <ChevronDown className="codex-play-chevron" aria-hidden="true" />
              </summary>
              <div className="codex-play-options">
                {sections.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    aria-disabled="true"
                    title={`${label} — coming soon`}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                    <small>Coming soon</small>
                  </button>
                ))}
              </div>
            </details>
            <button
              type="button"
              className="codex-nav-item"
              aria-disabled="true"
              title="Give feedback — coming soon"
            >
              <MessageSquare aria-hidden="true" />
              <span>Give feedback</span>
              <span className="sr-only"> (coming soon)</span>
            </button>
          </nav>
          <div className="codex-tools">
            <button
              type="button"
              className="codex-search-trigger"
              onClick={() => openPanel("search")}
              aria-label="Search Codex"
              aria-haspopup="dialog"
            >
              <Search aria-hidden="true" />
              <span>Search…</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              type="button"
              className="codex-icon-button"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              title="Toggle theme"
            >
              {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="codex-icon-button"
              aria-label="Settings"
              aria-haspopup="dialog"
              onClick={() => openPanel("settings")}
            >
              <Settings aria-hidden="true" />
            </button>
            <UserMenu />
          </div>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="codex-dialog"
        aria-labelledby="codex-dialog-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="codex-dialog-content">
          <div className="codex-dialog-heading">
            <h2 id="codex-dialog-title">
              {panel === "search"
                ? "Search the Codex"
                : panel === "settings"
                  ? "Settings"
                  : "Welcome, adventurer"}
            </h2>
            <button
              type="button"
              className="codex-icon-button"
              aria-label="Close dialog"
              onClick={() => dialog.current?.close()}
            >
              <X />
            </button>
          </div>
          {panel === "search" ? (
            <>
              <label className="sr-only" htmlFor="codex-search">
                Search pages
              </label>
              <input
                ref={searchInput}
                id="codex-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a page…"
                autoComplete="off"
              />
              <div className="codex-search-results">
                {pages.map((page) => (
                  <Link key={page.to} to={page.to} onClick={() => dialog.current?.close()}>
                    <strong>{page.name}</strong>
                    <span>{page.description}</span>
                  </Link>
                ))}
                {pages.length === 0 && (
                  <p>No pages found. Play, Characters, Dice, and Wiki are coming soon.</p>
                )}
              </div>
            </>
          ) : panel === "settings" ? (
            <div className="codex-preference">
              <span>
                Appearance <small>{dark ? "Dark" : "Light"} theme</small>
              </span>
              <button type="button" onClick={toggleTheme}>
                Use {dark ? "light" : "dark"} theme
              </button>
            </div>
          ) : (
            <p>You’re browsing as a guest. Account sign-in is coming soon.</p>
          )}
        </div>
      </dialog>
    </header>
  );
}
