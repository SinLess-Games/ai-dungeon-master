import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { AppShell, PageTitle } from "@/components/AppShell";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — The Endless Codex" },
      {
        name: "description",
        content:
          "Site metrics for The Endless Codex: player signups, active accounts, heroes, campaigns, worlds, maps and dice activity.",
      },
      { property: "og:title", content: "Admin Dashboard — The Endless Codex" },
      {
        property: "og:description",
        content: "Player signups, active accounts and content growth across The Endless Codex.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = useSession();
  const { isAdmin, loading } = useIsAdmin();

  if (!user || (!isAdmin && !loading)) {
    return (
      <AppShell>
        <PageTitle title="Admin" subtitle="Restricted area" />
        <Card className="max-w-lg border-primary/25 bg-card/70">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {user ? (
              <>This page is for site administrators only.</>
            ) : (
              <>
                Please{" "}
                <Link to="/auth" className="text-primary underline">
                  sign in
                </Link>{" "}
                to continue.
              </>
            )}
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 md:flex-row">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}
