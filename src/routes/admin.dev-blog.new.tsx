import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";
import { PostEditor } from "@/components/blog/PostEditor";

export const Route = createFileRoute("/admin/dev-blog/new")({
  component: NewPost,
});

function NewPost() {
  return (
    <div>
      <PageTitle title="New chronicle entry" subtitle="Write it, preview it, then publish when ready." />
      <PostEditor />
    </div>
  );
}
