# Devblog

The public blog is at `/devblog`; posts use `/devblog/:slug`. **Devblog studio** in the admin console opens `/devblog/admin`. Routes are organized in `src/app/routes/devblog/`; account and administration routes remain in `src/app/routes/user/` as requested.

## Authoring

1. Sign in as an administrator, open Devblog studio, and choose **New post**.
2. Enter a title (the initial URL slug is generated automatically), excerpt, and Markdown body.
3. Use **Upload an image** to browse your computer for a PNG, JPEG, or WebP file up to 5 MB and provide alt text. On a new post, the editor automatically creates a draft before uploading so you do not need to manually save first.
4. Choose an uploaded cover image, or use **Insert in Markdown** to embed an image. Images are scoped to the post that owns them.
5. Switch between **Write Markdown** and **Preview**. Headings, emphasis, lists, links, blockquotes, code blocks, GFM tables, rules, and uploaded images are supported.
6. Choose **Published** and save to make the post public. Choose **Archived** and save to remove it from public pages while preserving its content, comments, and media. Archived posts can be restored.

The editor warns about unsaved navigation and uses an optimistic timestamp check to reject overwriting a newer edit. Slugs are bounded, normalized, unique, and cannot use the reserved admin path. Changing a published slug breaks its previous URL; historical redirects are a future improvement. Archive is the deliberate deletion mechanism; no destructive hard-delete endpoint is exposed.

## Comments and moderation

Visitors can comment without an account using a display name. Signed-in comments use the authenticated account identity, ignoring any supplied author name. All comments start pending. The studio's Comments tab allows approval, rejection, and returning comments to review. Only approved comments on published posts appear publicly.

Comment bodies are plain text, rendered through React escaping. Requests are validated, bounded, checked for same-origin submission, and limited to five comments per hour per account or anonymous IP identity. The limit is enforced by an atomic D1 INSERT. Anonymous identity is an HMAC of Cloudflare's connecting-IP header, not a stored raw IP. A honeypot catches basic form bots. For large public traffic, add Turnstile or edge abuse controls as an operational enhancement.

## Storage and access

`drizzle/0004_devblog.sql` adds posts, comments, and media metadata; its Drizzle snapshot and journal are included. D1 stores content and metadata only. R2 stores image bytes under immutable `devblog/<post-id>/<media-id>` keys. The existing `DB` and `R2_BUCKET` bindings are used; no new service or secrets are needed.

Uploads require admin access, have a bounded body, check image signatures/MIME types, reject SVG, and clean up the R2 object if the metadata insert fails. Dimensions are supplied by browser decoding and remain advisory metadata. Alt text is required. Media is served through the Worker with nosniff and a restrictive CSP; draft/archived media requires an administrator. Responses are not publicly cached so archiving also withdraws image access. Unused uploads remain associated with their post; there is no automatic destructive cleanup.

All admin API requests validate the authoritative Better Auth session, regardless of UI visibility. Mutations also check Origin. SQL uses bound Drizzle parameters. Public DTOs omit moderation fields, ownership IDs, and comment rate keys. Private TanStack Query entries are keyed by viewer and cleared through the existing logout flow.

Markdown uses react-markdown and remark-gfm without raw HTML or unsafe HTML plugins. Unsafe link protocols are filtered. Only same-origin devblog media URLs render as images, preventing remote tracking images and data/SVG images.

Public pages set descriptive titles and metadata using React 19. The application retains its existing Vite SPA delivery; server-rendered Open Graph previews for crawlers that do not execute JavaScript are a future enhancement.

## Running and validating

- Fresh local databases: `npm run db:migrate:local`, then `npm run dev`.
- This workspace's existing local database has a legacy campaigns table that conflicts with the older campaign migration. The new additive devblog migration was applied directly and recorded in the local migration ledger; legacy campaigns were preserved. Do not mark that unrelated campaign migration applied without converting its data.
- Deployment: apply pending migrations to the target D1 and ensure its existing R2 binding is available before publishing the Worker. No remote migration or deployment was performed for this task.
- `npm run build`: bundle and strict TypeScript checks.
- `npm run test:unit`: includes slug/content validation and secure Markdown rendering tests.
- `npm run test:devblog`: disposable local D1/R2 plus a real browser. Covers drafts, preview, R2 upload, cover/inline images, publishing, slug conflicts, concurrent edits, public access, anonymous/member comments, moderation, throttling, archival, authorization, and mobile overflow. Requires installed Playwright Chromium; `PLAYWRIGHT_BROWSERS_PATH` can select the browser cache.
