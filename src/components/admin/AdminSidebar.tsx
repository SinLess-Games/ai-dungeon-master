import { Link, useRouterState } from "@tanstack/react-router";
import { Award, BarChart3, CreditCard, LayoutDashboard, Inbox, MessageSquareWarning, Newspaper, Users } from "lucide-react";

const ITEMS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/players", label: "Players", icon: Users },
  { to: "/admin/inbox", label: "Inbox", icon: Inbox },
  { to: "/admin/content", label: "Content", icon: BarChart3 },
  { to: "/admin/dev-blog", label: "Dev Blog", icon: Newspaper },
  { to: "/admin/billing", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/titles", label: "Titles", icon: Award },
  { to: "/admin/feedback", label: "Feedback", icon: MessageSquareWarning },
] as const;



export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Admin sections"
      className="flex gap-2 overflow-x-auto rounded-xl border border-primary/25 bg-card/60 p-2 md:sticky md:top-4 md:w-56 md:shrink-0 md:flex-col md:overflow-visible"
    >
      <p className="hidden px-2 pb-1 pt-1 text-xs uppercase tracking-[0.18em] text-primary/80 md:block">
        Admin
      </p>
      {ITEMS.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-primary/15 font-medium text-primary"
                : "text-foreground/75 hover:bg-primary/10 hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
