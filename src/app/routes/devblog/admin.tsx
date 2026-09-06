import { createFileRoute } from "@tanstack/react-router";
import { DevBlogAdmin } from "@/modules/devblog/ui/DevBlogAdmin";
export const Route = createFileRoute("/devblog/admin")({ component: DevBlogAdmin });
