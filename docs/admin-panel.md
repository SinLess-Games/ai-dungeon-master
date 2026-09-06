# Admin panel

Sign in as an administrator and choose **Admin panel** in the account menu, or visit `/user/admin`.

The first version provides:

- Rolling 7-day and 30-day signup counts (inclusive cutoff through the request time), plus total saved campaigns. Deleted accounts/campaigns are excluded. AI messages return null and display “Not tracking yet” because this rebuild has no AI send endpoint or message store; this is not a measured zero.
- Live total accounts, administrator count, unexpired sessions, and effective account suspensions.
- Username/email substring search, role/status filters, and 20-account pages, newest first.
- Account suspension with a required reason and confirmation. Better Auth revokes the account's sessions. Restore access uses Better Auth's unban API. The current account cannot suspend itself.
- Loading, error, retry, empty-search, signed-out, and access-denied states.
- Responsive layout, with a horizontally scrollable account table on narrow screens.

`src/modules/admin/server/routes.ts` serves `/api/admin/overview` and `/api/admin/users`. Every request obtains the authoritative Better Auth session and requires exact global role `admin`, even if called outside the UI. Responses use `Cache-Control: no-store`. Account DTOs exclude password hashes, session tokens, and OAuth credentials. Search/filter inputs are validated and bound to SQL parameters. Expired temporary bans do not count as currently suspended.

`src/modules/admin/client/queries.ts` uses Hono's typed client. Query keys include the viewer's ID, mark private data with `meta.requiresAuth`, and discard cached data when unmounted. The existing logout flow cancels and removes private queries. The overview refreshes every 30 seconds; Refresh reloads the overview and account list on demand.

`src/modules/admin/ui/AdminPage.tsx` contains the dashboard, `AccountAction.tsx` contains the confirmation dialog, and `admin.css` follows the existing dark/gold theme. TanStack generates the `/admin` route tree from `src/app/routes/admin.tsx`; the user menu links to it only for admins.

No new tables or migrations are required. Campaign administration is not included because the legacy local campaign data still needs conversion to the new schema.

Validation: `npm run build`, focused ESLint, and `npm run test:auth:browser`. The browser suite uses isolated local D1 and disposable accounts to verify guest/user denial, admin reads, private DTOs, invalid filters, search, role/status filters, suspend/restore, route reload, logout data clearing, and desktop/mobile layouts. It never suspends a real user.

The **Devblog studio** navigation link opens `/devblog/admin` for post authoring, R2 images, publishing/archiving, and comment moderation. See [Devblog](devblog.md).

## Detailed metrics

Platform insights adds rolling 7/30-day signup and campaign counts compared with the preceding equal-length periods, a selectable daily chart with an accessible count table for the last 30 UTC calendar days, verified/unverified account counts, and distinct users with unexpired sessions. The chart includes partial today; its calendar window differs from the rolling comparison window.

Publishing metrics show draft/published/archived posts, all stored blog images and their aggregate metadata byte size, and comments by moderation status. Comments whose account was deleted are included with anonymous comments because the schema nulls their user ID. Storage is recorded blog image size, not bucket-wide usage or billing.

Feedback metrics show total/open/resolved bugs, high or critical open bugs, and feature requests by workflow stage. Open bugs include open, triaged, and in progress. The endpoint is /api/admin/metrics, protected by the existing admin middleware. It refreshes every 30 seconds. Campaign timestamp normalization supports current Unix-second dates and legacy ISO text without modifying saved campaigns. Deleted records are excluded, so these are retained-record counts rather than immutable lifetime event counters.
