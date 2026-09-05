import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Users, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useSession } from "@/hooks/useSession";
import { useSubscription } from "@/hooks/useSubscription";
import { getStripeEnvironment } from "@/lib/stripe";
import { createPortalSession } from "@/utils/payments.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


export const Route = createFileRoute("/upgrade")({
  head: () => ({
    meta: [
      { title: "Multiplayer Pass — The Endless Codex" },
      {
        name: "description",
        content:
          "Unlock multiplayer campaigns, party invites, shared game state, and raised save limits.",
      },
      { property: "og:title", content: "Multiplayer Pass — The Endless Codex" },
      {
        property: "og:description",
        content:
          "Unlock multiplayer campaigns, party invites, shared game state, and raised save limits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://endless-codex.sinlessindustries.com/upgrade" },
    ],
    links: [{ rel: "canonical", href: "https://endless-codex.sinlessindustries.com/upgrade" }],
  }),
  component: UpgradePage,
});

const PERKS = [
  { icon: Users, text: "Invite other players to your party and campaigns" },
  { icon: Sparkles, text: "Shared real-time game state across the whole party" },
  { icon: Save, text: "Raised character and campaign save limits" },
];

function UpgradePage() {
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const { user } = useSession();
  const { subscription, isActive } = useSubscription();
  const openPortal = useServerFn(createPortalSession);

  const open = (priceId: string) => {
    if (!user) {
      toast.error("Sign in first so your pass is linked to your account.");
      return;
    }
    openCheckout({
      priceId,
      userId: user.id,
      customerEmail: user.email,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  const manageBilling = async () => {
    try {
      const result = await openPortal({
        data: { returnUrl: window.location.href, environment: getStripeEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      window.open(result.url, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open billing.");
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="font-display text-lg text-foreground">
            AI Dungeon Master
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              Back to the table
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {isOpen ? (
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="font-display text-2xl text-foreground">Complete your purchase</h1>
              <Button variant="outline" size="sm" onClick={closeCheckout}>
                Cancel
              </Button>
            </div>
            {checkoutElement}
          </div>
        ) : (
          <>
            <div className="mb-10 text-center">
              <h1 className="font-display text-4xl text-foreground">Multiplayer Pass</h1>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Solo adventures are free forever. Bring your whole party to the table with
                multiplayer campaigns, invites, and bigger save slots.
              </p>
            </div>

            {isActive ? (
              <Card className="card-etched mx-auto mb-10 max-w-xl border-primary/50">
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <Badge>Your pass is active</Badge>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.cancel_at_period_end
                      ? "Your pass ends on "
                      : "Your pass renews on "}
                    {subscription?.current_period_end
                      ? new Date(subscription.current_period_end).toLocaleDateString()
                      : "your next billing date"}
                    .
                  </p>
                  <Button variant="outline" onClick={manageBilling}>
                    Manage billing
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <h2 className="mb-8 text-center font-display text-2xl text-foreground">Choose your plan</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="card-etched">
                <CardHeader>
                  <CardTitle className="font-display">Monthly</CardTitle>
                  <CardDescription>Flexible, cancel anytime</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="font-display text-4xl text-foreground">
                    $10<span className="text-base text-muted-foreground">/month</span>
                  </p>
                  <ul className="space-y-2">
                    {PERKS.map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-start gap-2 text-sm text-foreground">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {text}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" onClick={() => open("multiplayer_monthly")}>
                    Subscribe monthly
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-etched relative border-primary/50">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Two months free
                </Badge>
                <CardHeader>
                  <CardTitle className="font-display">Yearly</CardTitle>
                  <CardDescription>Best value for long campaigns</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="font-display text-4xl text-foreground">
                    $100<span className="text-base text-muted-foreground">/year</span>
                  </p>
                  <ul className="space-y-2">
                    {PERKS.map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-start gap-2 text-sm text-foreground">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {text}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" onClick={() => open("multiplayer_yearly")}>
                    Subscribe yearly
                  </Button>
                </CardContent>
              </Card>
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Subscriptions stay active until the end of the paid period if you cancel. Taxes
              are calculated at checkout.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
