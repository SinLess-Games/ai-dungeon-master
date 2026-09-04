import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminMetrics } from "@/hooks/useAdminMetrics";

export const Route = createFileRoute("/admin/players")({
  component: AdminPlayers,
});

function AdminPlayers() {
  const { metrics, error } = useAdminMetrics(true);

  return (
    <>
      <PageTitle title="Players" subtitle="Newest accounts and their roles" />

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {!metrics ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card className="border-primary/25 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg text-primary">Newest players</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="overflow-auto">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-primary/30 text-xs uppercase tracking-[0.12em] text-foreground/70">
                    <th className="py-2.5 pr-3 font-medium">Name</th>
                    <th className="py-2.5 pr-3 font-medium">Email</th>
                    <th className="py-2.5 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentUsers.map((u) => (
                    <tr key={u.id} className="border-b border-border/40">
                      <td className="py-2.5 pr-3">
                        <span className="text-foreground">{u.displayName}</span>
                        {u.isAdmin ? (
                          <Badge variant="outline" className="ml-2 gap-1 border-primary/50 text-[0.7rem] font-normal text-primary">
                            <ShieldCheck className="size-3" /> Admin
                          </Badge>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-3 text-foreground/80">{u.email}</td>
                      <td className="py-2.5 text-foreground/80">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
