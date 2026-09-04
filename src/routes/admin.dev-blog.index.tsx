import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BLOG_STATUSES, formatDate, type BlogPost, type BlogStatus } from "@/lib/dev-blog";
import {
  deletePost,
  duplicatePost,
  listAllPosts,
  listAudit,
  setPostStatus,
  type AuditEntry,
} from "@/lib/dev-blog.functions";

export const Route = createFileRoute("/admin/dev-blog/")({
  component: AdminDevBlog,
});

const STATUS_STYLE: Record<string, string> = {
  published: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  draft: "border-border/60 bg-muted/40 text-muted-foreground",
  scheduled: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  archived: "border-amber-500/40 bg-amber-500/10 text-amber-300",
};

function AdminDevBlog() {
  const load = useServerFn(listAllPosts);
  const loadAudit = useServerFn(listAudit);
  const changeStatus = useServerFn(setPostStatus);
  const duplicate = useServerFn(duplicatePost);
  const remove = useServerFn(deletePost);

  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pending, setPending] = useState<BlogPost | null>(null);

  async function refresh() {
    try {
      const [rows, entries] = await Promise.all([load({}), loadAudit({})]);
      setPosts(rows);
      setAudit(entries);
    } catch (e: any) {
      setError(e?.message ?? "Could not load posts");
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const base = { total: 0, published: 0, draft: 0, scheduled: 0, archived: 0 } as Record<string, number>;
    for (const p of posts ?? []) {
      base["total"]! += 1;
      base[p.status] = (base[p.status] ?? 0) + 1;
    }
    return base;
  }, [posts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (posts ?? []).filter(
      (p) =>
        (statusFilter === "all" || p.status === statusFilter) &&
        (!q ||
          p.title.toLowerCase().includes(q) ||
          p.slug.includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))),
    );
  }, [posts, search, statusFilter]);

  async function act(fn: () => Promise<unknown>, message: string) {
    try {
      await fn();
      toast.success(message);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "That did not work");
    }
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-card/70">
        <CardContent className="p-6 text-sm text-muted-foreground">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div>
      <PageTitle
        title="Dev Blog"
        subtitle="Write, schedule and publish entries in the Developer Chronicle."
        action={
          <Button asChild>
            <Link to="/admin/dev-blog/new">
              <Plus className="mr-2 size-4" /> New post
            </Link>
          </Button>
        }
      />

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ["Total", counts["total"]],
          ["Published", counts["published"]],
          ["Drafts", counts["draft"]],
          ["Scheduled", counts["scheduled"]],
          ["Archived", counts["archived"]],
        ].map(([label, value]) => (
          <Card key={label as string} className="border-primary/25 bg-card/70">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-2xl text-primary">{(value as number) ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, slug, category or tag"
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {BLOG_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!posts ? (
        <Skeleton className="h-64 w-full" />
      ) : filtered.length === 0 ? (
        <Card className="border-primary/25 bg-card/70">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No posts yet. Create the first entry of the chronicle.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary/25">
          <table className="w-full min-w-[54rem] border-collapse text-sm">
            <thead className="bg-primary/10">
              <tr className="text-left font-display text-xs uppercase tracking-wider text-primary">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Author</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Tags</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2">Published</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border/40 align-top">
                  <td className="px-3 py-2">
                    <Link
                      to="/admin/dev-blog/$id/edit"
                      params={{ id: p.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">/{p.slug}</p>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className={STATUS_STYLE[p.status]}>{p.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{p.authorName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.category}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{p.tags.join(", ") || "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(p.createdAt)}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(p.updatedAt)}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {formatDate(p.publishedAt ?? p.scheduledAt) || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap justify-end gap-1">
                      <IconBtn to={`edit`} id={p.id} kind="edit" />
                      <IconBtn to={`preview`} id={p.id} kind="preview" />
                      {p.status === "published" ? (
                        <Button size="sm" variant="ghost"
                          onClick={() => act(() => changeStatus({ data: { id: p.id, status: "draft" } }), "Unpublished")}>
                          Unpublish
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost"
                          onClick={() => act(() => changeStatus({ data: { id: p.id, status: "published" } }), "Published")}>
                          Publish
                        </Button>
                      )}
                      {p.status !== "archived" ? (
                        <Button size="sm" variant="ghost"
                          onClick={() => act(() => changeStatus({ data: { id: p.id, status: "archived" as BlogStatus } }), "Archived")}>
                          Archive
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" aria-label="Duplicate"
                        onClick={() => act(() => duplicate({ data: { id: p.id } }), "Duplicated")}>
                        <Copy className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" aria-label="Delete" onClick={() => setPending(p)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {audit.length ? (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-sm uppercase tracking-[0.2em] text-primary">
            Recent activity
          </h2>
          <Card className="border-primary/25 bg-card/70">
            <CardContent className="space-y-2 p-4 text-sm">
              {audit.slice(0, 10).map((a) => (
                <p key={a.id} className="text-muted-foreground">
                  <span className="text-foreground">{a.actorName}</span> — {a.action} —{" "}
                  <span className="text-foreground/80">{a.postTitle || "(removed)"}</span>{" "}
                  <span className="text-xs">{formatDate(a.createdAt)}</span>
                </p>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pending?.title}” will be removed permanently. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = pending;
                setPending(null);
                if (target) void act(() => remove({ data: { id: target.id } }), "Post deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function IconBtn({ id, kind }: { to: string; id: string; kind: "edit" | "preview" }) {
  return (
    <Button asChild size="sm" variant="ghost" aria-label={kind}>
      {kind === "edit" ? (
        <Link to="/admin/dev-blog/$id/edit" params={{ id }}>
          <Pencil className="size-4" />
        </Link>
      ) : (
        <Link to="/admin/dev-blog/$id/preview" params={{ id }}>
          <Eye className="size-4" />
        </Link>
      )}
    </Button>
  );
}
