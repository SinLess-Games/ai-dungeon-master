# Dependency security pins

These pins come from the November 2026 review. Versions below are the ones
installed in `package-lock.json`. Do not "fix" a residual by jumping a major
or by taking npm audit's suggested downgrade.

## Auth

`better-auth` is pinned to **1.7.18**, below 1.8. The Drizzle adapter and the
Admin and username plugins ship inside that package, so they stay on the same
release. Restart in-flight OAuth and magic-link flows after upgrading. This app
does not register the Magic Link or OAuth Proxy plugins.

## Workers toolchain

Direct `wrangler` is **4.158.0**. `@cloudflare/vite-plugin` is **1.67.0**.
Wrangler 4.158.0 depends on `miniflare@5.20261104.0-beta`. The Vite plugin
depends on its own `wrangler@4.156.1`, which depends on
`miniflare@5.20261101.0-beta`. Both miniflare releases are betas; that is the
version those packages publish, not an accidental dist-tag.

`compatibility_date` stays `2026-09-05` with
`@cloudflare/workers-types@5.20260905.1`. Bumping Wrangler does not require a
newer compatibility date.

Both miniflare copies pin `undici@7.30.1`. `package.json` overrides only
miniflare's undici to **7.30.2**. jsdom's copy stays on the 8.x line at
**8.12.4** (`jsdom@30.1.3`, whose range is `undici@^8.12.1`, plus a jsdom-scoped
override). Do not set a root `undici` override; that would collapse the two lines.

`sharp@0.35.5` is the copy both miniflare releases declare.

## Client and validation libraries

- `vite` **8.3.6** (at least 8.2.4).
- `zod` **4.6.7**.
- `hono` **4.13.16**. The app does not call `mount()` and does not use custom
  parameters that match an empty string, such as `{[0-9]*}`. Star-suffix
  middleware (`/api/characters*`, `sheet*`, and the other `prefix*` paths) still
  registers on Hono's default SmartRouter. Forcing `RegExpRouter` alone throws
  `UnsupportedPathError` where a `prefix*` pattern sits beside a longer route
  such as `messages/:messageId`. SmartRouter catches that and uses another
  router. Leave the default router in place.
- `seroval` and `seroval-plugins` are overridden to **1.6.11**. That is below
  1.7. `@tanstack/router-core` only accepts `seroval@^1.6`, so do not lift the
  override to 1.7.

The `ai`, `@ai-sdk/react`, and `@ai-sdk/openai-compatible` packages were removed.
No static or dynamic import referenced them. Generation uses the Workers AI
binding in `src/infrastructure/ai/openaiCompatible.ts`.

## Tests and lint tools

`vitest`, `@vitest/coverage-v8`, and `@vitest/mocker` are **4.1.12**. Do not
upgrade this repo to Vitest 5 to clear an advisory.

Same-major overrides:

- `source-map-js` **1.2.2**
- `brace-expansion` **1.1.21** on the 1.x line and **5.0.12** on the 5.x line

`minimatch` stays on 10.2.6 (and the unrelated 3.1.5 line). `glob` stays on
13.0.6. Do not force minimatch 11 or glob 14; those are residual advisories
(GHSA-g3hv-75wg-m249 and GHSA-3g3m-2fjr-6pw4) in dev tooling.

`uuid@7.0.3` remains through `@capacitor/cli` → `xcode`
(GHSA-w5hq-g745-h8pq). The 7.x line has no patched release. Do not force uuid
11 into the Capacitor CLI tree.

## drizzle-kit and esbuild

`drizzle-kit` is **0.31.11**. It still pulls `@esbuild-kit/core-utils`, which
pins `esbuild@0.18.20` (GHSA-67mh-4wv8-2f99). That copy bundles the Drizzle
config; the app does not run esbuild's dev server. npm audit may suggest
downgrading drizzle-kit to 0.18.1. Do not take that downgrade.

`npm run db:generate` is still unsafe. `drizzle/meta/_journal.json` and the
snapshots stop at `0004_devblog`, while `drizzle/*.sql` continues through
`0028`, including two `0012_*.sql` files. Regenerating the journal from the
stale snapshot would emit new SQL. The journal was left unchanged. Wrangler
applies `drizzle/**/*.sql` by filename.

`0028_drop_account_issuer.sql` was written by hand for the Better Auth 1.7.18
upgrade. SQLite cannot relax `NOT NULL` in place, so the migration drops
`accounts.issuer` and the old issuer unique index, then adds a unique index on
`(provider_id, account_id)`. Apply it only through the local Wrangler migration
command until an operator explicitly reviews a remote D1 migration. Duplicate
`(provider_id, account_id)` pairs must be resolved first; the unique index
fails closed.

## Node.js

CI installs Node.js **26** (`actions/setup-node` with `node-version: 26`). Keep
that line. A security release for Node 22, 24, and 26 is scheduled on or
shortly after 11 November 2026. The announcement's highest severity is high.
It does not name CVEs or the replacement version numbers, so this repo does not
pin one.

## Rust

`tokio` is **1.53.3** (`cargo update -p tokio --precise 1.53.3`). `glib` stays
**0.18.5**. Do not force glib 0.20; the Linux WebKitGTK crates in
`src-tauri/Cargo.lock` are built against 0.18. GHSA-wrw7-89jp-8q8g remains a
residual on that line.

## Dev server and assets

`vite.config.ts` binds the dev server to `localhost`. Client `build.sourcemap`
is `false`, so Vite does not emit public `.map` files. `upload_source_maps`
stays enabled for Worker script maps Cloudflare accepts outside the asset
directory.

`wrangler.jsonc` sets `workers_dev` and `preview_urls` to false. Production
traffic and OAuth callbacks use `endless-codex.sinlessindustries.com` (see
`docs/authentication.md`). This config has no preview environment, so a preview
URL would publish the same production bindings on a second hostname outside
`trustedOrigins`.
