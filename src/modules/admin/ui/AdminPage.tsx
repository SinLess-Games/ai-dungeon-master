import { DetailedMetrics } from "./DetailedMetrics";
import { FeedbackInbox } from "./FeedbackInbox";
import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BookOpen,
  CalendarDays,
  Map,
  MessageSquare,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  UserX,
} from "lucide-react";
import { authClient } from "@/modules/auth/client/authClient";
import { useAuthModal } from "@/shared/stores/authModal.store";
import {
  AdminAccessError,
  accountsQuery,
  overviewQuery,
  type AccountFilters,
  type AdminAccount,
} from "../client/queries";
import { AccountAction } from "./AccountAction";
import "./admin.css";

export function AdminPage() {
  const session = authClient.useSession();
  if (session.isPending) return <AccessState title="Checking your access…" />;
  if (session.error)
    return (
      <AccessState title="Unable to check your account">
        <button type="button" onClick={() => void session.refetch()}>
          Try again
        </button>
      </AccessState>
    );
  if (!session.data)
    return (
      <AccessState
        title="Sign in to continue"
        description="The administration area is available to administrators."
      >
        <button type="button" onClick={useAuthModal.getState().openLogin}>
          Sign In
        </button>
      </AccessState>
    );
  if (session.data.user.role !== "admin")
    return (
      <AccessState
        title="Administrator access required"
        description="Your account doesn’t have access to this area."
      />
    );
  return <AdminDashboard key={session.data.user.id} userId={session.data.user.id} />;
}
function AccessState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="admin-page admin-access">
      <ShieldCheck size={38} aria-hidden="true" />
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {children}
      <Link to="/">Return home</Link>
    </main>
  );
}
function AdminDashboard({ userId }: { userId: string }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AccountFilters>({
    search: "",
    role: "all",
    status: "all",
    page: 0,
  });
  const [selected, setSelected] = useState<AdminAccount | null>(null);
  const overview = useQuery(overviewQuery(userId));
  const accounts = useQuery(accountsQuery(userId, filters));
  if (overview.error instanceof AdminAccessError || accounts.error instanceof AdminAccessError)
    return (
      <AccessState
        title="Administrator access required"
        description="Your session or permissions have changed. Sign in again to continue."
      />
    );
  const totalPages = Math.max(1, Math.ceil((accounts.data?.total ?? 0) / 20));
  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: search.trim(), page: 0 }));
  }
  const stats = [
    {
      label: "New users · 7 days",
      value: overview.data?.newUsers7Days,
      icon: CalendarDays,
      note: "Signups in the last 7 days",
    },
    {
      label: "New users · 30 days",
      value: overview.data?.newUsers30Days,
      icon: Users,
      note: "Signups in the last 30 days",
    },
    {
      label: "Campaigns created",
      value: overview.data?.campaigns,
      icon: Map,
      note: "All saved campaigns, including archived",
    },
    {
      label: "Messages sent to AI",
      value: overview.data ? "Not tracking yet" : undefined,
      icon: MessageSquare,
      note: "Available once AI messaging is connected",
    },
    {
      label: "Total accounts",
      value: overview.data?.users,
      icon: Users,
      note: "Registered adventurers",
    },
    {
      label: "Administrators",
      value: overview.data?.administrators,
      icon: ShieldCheck,
      note: "Global administrative access",
    },
    {
      label: "Active sessions",
      value: overview.data?.activeSessions,
      icon: Activity,
      note: "Unexpired sign-in sessions",
    },
    {
      label: "Suspended accounts",
      value: overview.data?.suspended,
      icon: UserX,
      note: "Currently restricted access",
    },
  ];
  return (
    <main className="admin-page">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <ShieldCheck aria-hidden="true" />
            <span>
              Codex Control<small>Administration</small>
            </span>
          </div>
          <nav aria-label="Administration">
            <a href="#admin-overview" className="is-current">
              <LayoutDashboard />
              Overview
            </a>
            <Link to="/devblog/admin">
              <BookOpen />
              Devblog studio
            </Link>
            <a href="#admin-feedback">
              <MessageSquare />
              Feedback
            </a>
            <a href="#admin-accounts">
              <Users />
              Accounts
            </a>
            <Link to="/status">
              <Activity />
              Service status
              <ArrowUpRight size={15} />
            </Link>
          </nav>
          <p>
            Manage the people
            <br />
            behind the stories.
          </p>
          <Link to="/" className="admin-return">
            ← Back to the Codex
          </Link>
        </aside>
        <div className="admin-content">
          <header className="admin-heading" id="admin-overview">
            <div>
              <p className="admin-eyebrow">The Endless Codex</p>
              <h1>Administration</h1>
              <p>Account activity and access, all in one place.</p>
            </div>
            <button
              type="button"
              className="admin-refresh"
              disabled={overview.isFetching || accounts.isFetching}
              onClick={() => {
                void overview.refetch();
                void accounts.refetch();
              }}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </header>
          {overview.isError && (
            <div role="alert" className="admin-error">
              Unable to load the overview. Use Refresh to try again.
            </div>
          )}
          <section className="admin-stats" aria-label="Platform overview">
            {stats.map(({ label, value, icon: Icon, note }) => (
              <article key={label}>
                <div>
                  <span>{label}</span>
                  <Icon size={19} aria-hidden="true" />
                </div>
                <strong style={typeof value === "string" ? { fontSize: "1.15rem" } : undefined}>
                  {overview.isError
                    ? "—"
                    : typeof value === "number"
                      ? value.toLocaleString()
                      : (value ?? "…")}
                </strong>
                <p>{note}</p>
              </article>
            ))}
          </section>
          <DetailedMetrics userId={userId} />
          <section className="admin-accounts" id="admin-accounts" aria-labelledby="accounts-title">
            <div className="admin-section-heading">
              <div>
                <h2 id="accounts-title">Accounts</h2>
                <p>Find adventurers and manage their access.</p>
              </div>
              <span className="admin-count">
                {accounts.data ? `${accounts.data.total} found` : "Loading…"}
              </span>
            </div>
            <form className="admin-filters" onSubmit={submitSearch}>
              <label className="admin-search">
                <Search size={18} aria-hidden="true" />
                <span className="sr-only">Search accounts</span>
                <input
                  value={search}
                  maxLength={100}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search username or email…"
                />
              </label>
              <button type="submit">Search</button>
              <label>
                <span className="sr-only">Account role</span>
                <select
                  value={filters.role}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      role: event.target.value as AccountFilters["role"],
                      page: 0,
                    }))
                  }
                >
                  <option value="all">All roles</option>
                  <option value="user">Users</option>
                  <option value="admin">Administrators</option>
                </select>
              </label>
              <label>
                <span className="sr-only">Account status</span>
                <select
                  value={filters.status}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      status: event.target.value as AccountFilters["status"],
                      page: 0,
                    }))
                  }
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
            </form>
            {accounts.isError ? (
              <div role="alert" className="admin-empty">
                <p>Unable to load accounts.</p>
                <button type="button" onClick={() => void accounts.refetch()}>
                  Try again
                </button>
              </div>
            ) : accounts.isPending ? (
              <p role="status" className="admin-empty">
                Loading accounts…
              </p>
            ) : accounts.data.users.length === 0 ? (
              <div className="admin-empty">
                <Users aria-hidden="true" />
                <h3>No accounts found</h3>
                <p>Try another search or reset your filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilters({ search: "", role: "all", status: "all", page: 0 });
                  }}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="admin-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Adventurer</th>
                      <th scope="col">Role</th>
                      <th scope="col">Status</th>
                      <th scope="col">Joined</th>
                      <th scope="col" className="admin-action-column">
                        Access
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.data.users.map((account) => (
                      <tr key={account.id}>
                        <td>
                          <div className="admin-person">
                            <span className="admin-initial" aria-hidden="true">
                              {(account.displayUsername || account.name).slice(0, 1).toUpperCase()}
                            </span>
                            <span>
                              <strong>
                                {account.displayUsername || account.username || account.name}
                                {account.id === userId && <small> · You</small>}
                              </strong>
                              <span>{account.email}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`admin-badge ${account.role === "admin" ? "is-admin" : ""}`}
                          >
                            {account.role === "admin" ? "Admin" : "User"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`admin-status ${account.suspended ? "is-suspended" : ""}`}
                          >
                            {account.suspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="admin-date">
                          {new Date(account.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="admin-action-column">
                          <button
                            type="button"
                            disabled={account.id === userId}
                            title={
                              account.id === userId
                                ? "You cannot suspend your own account"
                                : undefined
                            }
                            onClick={() => setSelected(account)}
                          >
                            {account.suspended ? "Restore" : "Suspend"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="admin-pagination">
              <span>
                Page {filters.page + 1} of {totalPages}
              </span>
              <div>
                <button
                  aria-label="Previous page"
                  type="button"
                  disabled={filters.page === 0 || accounts.isFetching}
                  onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  aria-label="Next page"
                  type="button"
                  disabled={filters.page + 1 >= totalPages || accounts.isFetching}
                  onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
          <FeedbackInbox userId={userId} />
          <p className="admin-footnote">
            <ShieldCheck size={14} />
            Administrative access is verified on every request.
          </p>
        </div>
      </div>
      {selected && (
        <AccountAction account={selected} viewerId={userId} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
