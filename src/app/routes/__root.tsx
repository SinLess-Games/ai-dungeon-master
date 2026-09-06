import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { AuthModal } from "@/modules/auth/ui/AuthModal";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";

export const Route = createRootRoute({
  component: RootLayout,

  notFoundComponent: () => (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card-etched max-w-lg rounded-xl bg-card p-8 text-center text-card-foreground">
        <p className="mb-2 text-sm uppercase tracking-widest text-muted-foreground">
          Endless Codex
        </p>

        <h1 className="mb-4 text-3xl font-display">Page Not Found</h1>

        <p className="mb-6 text-muted-foreground">
          The page you were looking for could not be found.
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Return Home
        </Link>
      </div>
    </main>
  ),

  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card-etched max-w-lg rounded-xl bg-card p-8 text-card-foreground">
        <p className="mb-2 text-sm uppercase tracking-widest text-destructive">Application Error</p>

        <h1 className="mb-4 text-3xl font-display">Something Went Wrong</h1>

        <p className="mb-6 text-muted-foreground">Endless Codex encountered an unexpected error.</p>

        {import.meta.env.DEV ? (
          <pre className="max-h-64 overflow-auto rounded-md bg-muted p-4 text-left text-xs text-muted-foreground">
            {error instanceof Error ? (error.stack ?? error.message) : String(error)}
          </pre>
        ) : null}
      </div>
    </main>
  ),
});

function RootLayout() {
  return (
    <>
      <SiteHeader />
      <AuthModal />
      <div id="main-content" tabIndex={-1}>
        <Outlet />
      </div>

      <Toaster richColors closeButton position="bottom-right" />
    </>
  );
}
