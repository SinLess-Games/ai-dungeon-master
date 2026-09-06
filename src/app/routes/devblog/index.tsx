import { createFileRoute } from "@tanstack/react-router";
import { DevBlogList } from "@/modules/devblog/ui/DevBlogList";
export const Route = createFileRoute("/devblog/")({ component: DevBlogList });
