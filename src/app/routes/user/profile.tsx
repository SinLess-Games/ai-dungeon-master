import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/modules/profile/ui/ProfilePage";
export const Route = createFileRoute("/user/profile")({ component: ProfilePage });
