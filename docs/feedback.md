# Feedback submissions

Give feedback in the shared navbar opens a responsive dialog with Bug Report and Feature Request options. Signed-in users supply a title, description, and optional reproduction steps or problem statement. Guests can open the dialog and sign in. Successful submissions show a confirmation; failures retain form content.

`POST /api/feedback` requires an authoritative Better Auth session and matching website Origin. Input lengths and type are validated on the server, with a 40 KB body limit. The server supplies the user ID and initial status and inserts into `bug_reports` or `feature_requests`. After the D1 write succeeds, the route enqueues a best-effort GitHub synchronization job on `GITHUB_SYNC_QUEUE`. A temporary GitHub or Queue failure never discards the player's feedback record.

## GitHub Issues synchronization

Feedback is synchronized with `SinLess-Games/ai-dungeon-master` through the **The Endless Codex Feedback Sync** GitHub App. D1 remains the application database; GitHub Issues is the developer-facing mirror.

The GitHub App uses:

- App ID `4943196`.
- Installation ID `161683158`.
- Repository permission **Issues: read and write** and mandatory **Metadata: read-only**.
- Webhook events **Issues** and **Issue comment**.
- Webhook endpoint `POST /api/integrations/github/webhook`.
- Repository `SinLess-Games/ai-dungeon-master` only.

The Worker must have the following production secrets configured through Wrangler/Cloudflare, never committed to source control:

```text
GITHUB_APP_PRIVATE_KEY
GITHUB_WEBHOOK_SECRET
```

`GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, and `GITHUB_REPOSITORY` are non-secret deployment configuration in `wrangler.jsonc`.

The webhook verifies `X-Hub-Signature-256` against the raw request body before parsing it. It records `X-GitHub-Delivery` in `github_webhook_deliveries` for idempotency, accepts GitHub's `ping`, ignores unrelated event types and pull-request issue events, and queues supported deliveries for asynchronous processing. JSON and legacy `application/x-www-form-urlencoded` webhook bodies are accepted, although the GitHub App webhook is the intended integration.

### Codex to GitHub

New in-app bug reports and feature requests become GitHub issues asynchronously. The generated issue contains the user-supplied description/details plus a hidden Endless Codex feedback marker; it does not include reporter email, Better Auth user ID, internal notes, session IDs, or other private account information.

The integration owns these labels:

- `source:feedback`
- `type:bug` / `type:feature`
- `status:*`
- `severity:*` for bugs
- `impact:*` and `category:*` for features

Non-integration labels added by developers are preserved. Closing/reopening follows the detailed Codex feedback lifecycle rather than reducing the application to GitHub's two-state model.

### GitHub to Codex

Webhook changes to a linked issue update the matching D1 feedback record. GitHub open/closed state is authoritative over stale status labels: closing an issue closes/completes it unless a compatible terminal status such as `duplicate`, `declined`, or `wont-fix` is already present; reopening returns it to the appropriate open/submitted state.

A GitHub issue that is not already linked is imported into the Feedback inbox when it is clearly a feedback issue. The supplied issue forms use `[Bug]` and `[Feature]` title prefixes for this purpose. Issues carrying the managed type labels are also recognized. Ordinary engineering issues are left alone.

The integration stores stable mappings in `github_feedback_links` and webhook delivery state in `github_webhook_deliveries`. Migration `drizzle/0023_github_feedback_sync.sql` creates both tables.

## Admin inbox

Administrators can read submissions in the Feedback inbox at `/admin`. The inbox separates bugs and features, shows reporter/source, current status, GitHub issue number/link, synchronization state, last synchronization time, and synchronization errors. It refreshes every 30 seconds and supports 20-item pages.

`GET /api/admin/feedback` requires the authoritative administrator session and excludes internal notes. `PATCH /api/admin/feedback/:type/:id` changes feedback status and enqueues a corresponding GitHub update. `POST /api/admin/feedback/:type/:id/sync` retries synchronization manually.

## Cloudflare Queue

`wrangler.jsonc` binds `GITHUB_SYNC_QUEUE` to `endless-codex-github-sync`, with `endless-codex-github-sync-dlq` as its dead-letter queue. GitHub synchronization and existing game background processing use separate queues so retries and API outages do not block each other.

Create the queues once per Cloudflare account if they do not already exist:

```bash
npx wrangler queues create endless-codex-github-sync
npx wrangler queues create endless-codex-github-sync-dlq
```

Before the first production deployment of this integration, apply the D1 migration and configure the two Worker secrets:

```bash
npx wrangler secret put GITHUB_APP_PRIVATE_KEY
npx wrangler secret put GITHUB_WEBHOOK_SECRET
npx wrangler d1 migrations apply DB --remote
```

The webhook secret stored in Cloudflare must exactly match the secret configured on the GitHub App webhook.
