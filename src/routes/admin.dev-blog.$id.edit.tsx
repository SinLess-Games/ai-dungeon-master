import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PageTitle } from "@/components/AppShell";
import { PostEditor } from "@/components/blog/PostEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BlogPost } from "@/lib/dev-blog";
import { getPostById } from "@/lib/dev-blog.functions";

export const Route = createFileRoute("/admin/dev-blog/$id/edit")({
  component: EditPost,
});

function EditPost() {
  const { id } = Route.useParams();
  const load = useServerFn(getPostById);
  const [post, setPost] = useState<BlogPost | null | "missing">(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    load({ data: { id } })
      .then((p) => !cancelled && setPost(p ?? "missing"))
      .catch((e: any) => !cancelled && setError(e?.message ?? "Could not load the post"));
    return () => {
      cancelled = true;
    };
  }, [id, load]);

  if (error) {
    return (
      <Card className="border-destructive/40 bg-card/70">
        <CardContent className="p-6 text-sm text-muted-foreground">{error}</CardContent>
      </Card>
    );
  }
  if (post === null) return <Skeleton className="h-96 w-full" />;
  if (post === "missing") {
    return (
      <Card className="border-primary/25 bg-card/70">
        <CardContent className="p-6 text-sm text-muted-foreground">That post no longer exists.</CardContent>
      </Card>
    );
  }

  return (
    <div>
      <PageTitle title="Edit entry" subtitle={post.title} />
      <PostEditor post={post} />
    </div>
  );
}
