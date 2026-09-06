import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { serviceStatusQuery } from "@/infrastructure/api/service-status";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/status")({ component: ServiceStatusPage });

const statusLabels = {
  healthy: "All systems operational",
  degraded: "Some features are temporarily unavailable",
  unhealthy: "The service is temporarily unavailable",
} as const;

function ServiceStatusPage() {
  const status = useQuery(serviceStatusQuery);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <Link to="/" className="mb-8 text-sm text-gold hover:underline">
        ← Back to Endless Codex
      </Link>
      <section className="card-etched rounded-xl bg-card p-8 text-card-foreground">
        <h1 className="font-display text-3xl">Service status</h1>
        <div role="status" aria-live="polite" className="my-6">
          {status.isPending ? (
            <p>Checking the service…</p>
          ) : status.isError ? (
            <p>We couldn’t check the service. Please try again.</p>
          ) : (
            <>
              <p className="text-lg font-medium">{statusLabels[status.data.status]}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Last checked {new Date(status.data.timestamp).toLocaleTimeString()}.
              </p>
            </>
          )}
        </div>
        <Button onClick={() => void status.refetch()} disabled={status.isFetching}>
          {status.isFetching ? "Checking…" : "Check again"}
        </Button>
      </section>
    </main>
  );
}
