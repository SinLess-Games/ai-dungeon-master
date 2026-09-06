import { createFileRoute } from "@tanstack/react-router";
import { DevBlogPost } from "@/modules/devblog/ui/DevBlogPost";
export const Route = createFileRoute("/devblog/$slug")({ component: Page });
function Page() {
  const { slug } = Route.useParams();
  return <DevBlogPost slug={slug} />;
}
