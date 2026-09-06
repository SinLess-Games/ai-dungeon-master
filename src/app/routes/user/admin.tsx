import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/modules/admin/ui/AdminPage";
export const Route = createFileRoute("/user/admin")({ component: AdminPage });
