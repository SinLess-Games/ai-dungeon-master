import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string | undefined } => ({
    session_id: typeof search["session_id"] === "string" ? (search["session_id"] as string) : undefined,
  }),
  head: () => ({
    meta: [{ title: "Purchase complete — AI Dungeon Master" }],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id: sessionId } = Route.useSearch();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 font-display text-3xl text-foreground">
          {sessionId ? "Welcome to the party" : "Checkout session not found"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {sessionId
            ? "Your Multiplayer Pass is active. Party invites, shared campaigns, and raised save limits are unlocked for your account."
            : "We couldn't find a completed checkout session. If you just paid, give it a moment and refresh."}
        </p>
        <div className="mt-6">
          <Link to="/">
            <Button>Return to the table</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
