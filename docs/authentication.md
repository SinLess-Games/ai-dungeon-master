# Endless Codex authentication

The web app uses Better Auth 1.7.2 through the same Cloudflare Worker as Hono and React. The browser calls `/api/auth` on its own origin; secrets and D1 stay on the server. No separate auth server, token storage, or CORS configuration is needed.

## Local setup

1. Copy `.dev.vars.example` to `.dev.vars` if the latter does not exist. Keep `.dev.vars` private and ignored by Git.
2. Set `BETTER_AUTH_SECRET` to a cryptographically random value of at least 32 characters, and `BETTER_AUTH_URL=http://localhost:5173`. Use the actual local origin if Vite runs on a different port; visit that same origin in the browser. The URL must be an origin without a trailing slash or path.
3. Set `SEED_ADMIN_PASSWORD` to your own password (8–128 characters). It has no default. Replace any password previously present in an example file; the example is now blank.
4. Run `npm run db:migrate:local`, then `npm run db:seed:admin`.
5. Run `npm run dev` and use **Sign In**, **Create Account**, or **Enter the Codex**. Sign in with the seed email or `Sinless777`.

The seed defaults to `timothy.pierce444@gmail.com`, display username `Sinless777`, normalized username `sinless777`, and global role `admin`. Override non-secret identity defaults with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_USERNAME`. No real administrator is created by the test suite.

The seed uses Wrangler's local D1 proxy and Vite's existing TypeScript loader. It never exposes a seed endpoint. New users and password credentials are created by the installed Admin plugin's official server-only `createUser` API. On reruns, it preserves the password and updates only operator-controlled role/username metadata. A username owned by another user fails rather than merging identities. Existing users without a password credential fail with no role change; establish a credential using Better Auth first. Run seeds serially. Missing `SEED_ADMIN_PASSWORD` fails before account creation.

`db:seed:admin` deliberately targets **local D1 only**. For production, first review/apply the auth migration and configure Worker secrets. In an authenticated Cloudflare operator shell or CI job, inject `BETTER_AUTH_URL=https://endless-codex.sinlessindustries.com`, `BETTER_AUTH_SECRET`, and `SEED_ADMIN_PASSWORD` through secure environment management, then run `npm run db:seed:admin:remote`. The explicit remote command uses a temporary Wrangler config with a remote D1 binding and refuses to reuse local `.dev.vars` secrets. Do not put secret values in shell command history. Never mount the seed function as a public route. No production seed or migration has been executed.

## Environment

| Variable                                     | Purpose                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `BETTER_AUTH_SECRET`                         | Required server secret, at least 32 random characters                                                              |
| `BETTER_AUTH_URL`                            | Required canonical origin; local `http://localhost:5173`, production `https://endless-codex.sinlessindustries.com` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`   | Enable Google when both are supplied                                                                               |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | Enable Discord when both are supplied                                                                              |
| `SEED_ADMIN_EMAIL`                           | Optional operator email override                                                                                   |
| `SEED_ADMIN_USERNAME`                        | Optional operator display username override                                                                        |
| `SEED_ADMIN_PASSWORD`                        | Required for seeding only; no default and never logged                                                             |
| `DB`                                         | Cloudflare D1 binding, configured in Wrangler                                                                      |

Use Cloudflare secret management (`npx wrangler secret put VARIABLE_NAME`, interactive input) for production secrets. Set the production canonical URL in the deployment environment. Do not put OAuth secrets or seed credentials into `VITE_` variables or committed Wrangler configuration. The factory fails if the auth secret, canonical origin, or DB is missing; health routes remain independently available.

## OAuth callback URLs

These paths are verified from Better Auth 1.7.2's `getOAuthCallbackPath(provider)` in `dist/oauth2/utils.mjs` and the actual authorization URLs produced by our factory with `/api/auth` as `basePath`.

| Provider | Local callback                                    | Production callback                                                     |
| -------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| Google   | `http://localhost:5173/api/auth/callback/google`  | `https://endless-codex.sinlessindustries.com/api/auth/callback/google`  |
| Discord  | `http://localhost:5173/api/auth/callback/discord` | `https://endless-codex.sinlessindustries.com/api/auth/callback/discord` |

Register these redirect URIs in Google Cloud Console and Discord Developer Portal respectively. For Google, register the corresponding origin as an authorized JavaScript origin if required by its console. Set the matching client ID and secret on the Worker. For another local port, update both `BETTER_AUTH_URL` and the registered redirect URI.

The modal uses official `signIn.social`, preserving the current application path on success. An OAuth error returns to the current path, opens the modal, and displays a safe error message. Unconfigured providers are disabled with an explanation. Live consent/callback completion needs real provider credentials and has not been tested with placeholder credentials.

Account linking uses Better Auth's supported mechanism. Implicit linking requires a verified existing local email and a sufficiently trusted/verified provider email; different-email linking is disabled. Since email/password signup does not yet verify email, it does **not** silently merge an unverified password account with a matching OAuth identity. Email delivery and account-linking management UI are future work; these safeguards are not bypassed.

## Server, session, and role architecture

- `src/modules/auth/server/auth.ts`: request-scoped `createAuth(env)`, Drizzle adapter with SQLite/plural auth tables, email/password, native username plugin, Admin plugin, social providers, explicit trusted origin, and persistent rate limits.
- `src/modules/auth/server/routes.ts`: raw Better Auth GET/POST handler, provider availability, `/api/me`, and `/api/admin/access`. Better Auth responses retain cookies and headers. Existing Hono health RPC typing is preserved.
- `src/modules/auth/server/requireAuth.ts`: `requireUser(auth, headers)` and `requireAdmin(auth, headers)` read the authoritative session, bypass cookie cache, and throw the existing `UnauthorizedError`/`ForbiddenError`. Admin requires exact role `admin`. Application endpoints return `Cache-Control: no-store`.
- `src/modules/auth/server/seed.ts`: operator-only seed logic. No production browser import.
- `src/modules/auth/client/authClient.ts`: official React client with username/Admin client plugins. `useSession()` owns loading, logged-in, logged-out, refresh, and cross-tab state.
- `src/modules/auth/client/queries.ts`: remove TanStack queries marked `meta: { requiresAuth: true }` on identity changes. Future private queries must set that metadata and include identity in their keys.

Sessions last seven days and refresh after one day. Better Auth controls HttpOnly session cookies, SameSite behavior, Secure cookies on HTTPS, password hashing, and token revocation. Tokens are never copied into browser storage. Cookie caching is not enabled. Database rate-limit counters survive Worker restarts. Cloudflare's `CF-Connecting-IP` is the configured IP header; auth requests bypass generic URL logging so OAuth callback query strings are not logged by Hono.

Global roles remain exactly `user` and `admin`. Admin plugin config is `defaultRole: "user", adminRoles: ["admin"]`; its role and ban fields are `input: false`. Malicious signup with `role: "admin"` is rejected by Better Auth. OAuth cannot submit a role override. Normal users cannot invoke Admin plugin user creation. The database role CHECK is retained. No campaign roles or separate admin table exist.

## Username and migration

Usernames accept ASCII letters, numbers, underscore, and hyphen, 3–32 characters, trimmed. Better Auth stores lowercase `username` for unique lookup and preserves casing in `displayUsername`. Client Zod validation and server plugin validation agree; passwords are not trimmed. Password signup requires a username on the server as well as in the UI. OAuth and legacy users may initially have null usernames, displaying their provider name until profile editing is implemented.

`drizzle/0003_rainy_dracula.sql` adds `users.username`, `users.display_username`, a unique username index, normalized username CHECK, and `rate_limits`. Its SQL was adjusted to add columns in place instead of rebuilding `users`, avoiding D1 foreign-key cascades. Existing credentials and sessions survive the migration. No unrelated D&D schema changes were generated. Run `npm run db:generate` to confirm no drift; review before applying any remote migration.

## Modal and UI

`AuthModal.tsx` composes a focused `CredentialForm.tsx` and `OAuthButtons.tsx`. Shared `Dialog.tsx` uses the browser's native modal focus trap, ESC/backdrop dismissal, and focus restoration. `FormField.tsx` associates labels, fields, and errors. Auth styling is in `src/modules/auth/ui/auth.css`.

The small `src/shared/stores/authModal.store.ts` stores only visibility and mode. Header and homepage open the same modal. Forms use Zod, correct autocomplete values, field errors, a form-level alert, pending states, duplicate-submission guards, and safe server error messages. Successful login/signup preserves the page, closes the modal, refreshes identity, and shows a toast.

`UserMenu.tsx` shows a loading state before the initial session resolves; errors offer retry rather than pretending the user is signed out. Guests get Sign In/Create Account. Signed-in users get display username/avatar/email, a profile placeholder, and Sign Out. Admin-only status is visible only for admins. The Admin panel link opens `/admin`, with live account/session counts, account search and filters, pagination, and confirmed suspend/restore actions. Admin data endpoints independently enforce `requireAdmin`; account changes use the official Better Auth Admin APIs. `/api/admin/access` remains available as a secured integration point.

## Files and validation

Created: `src/modules/auth/{server,client,domain,ui}/*`, `src/shared/stores/authModal.store.ts`, `src/ui/primitives/{Dialog,FormField}.tsx`, auth `rate-limit.ts`, migration/snapshot, `scripts/{seed-admin,verify-auth,verify-auth-browser}.mjs`, `tests/unit/{auth,auth-migration}.test.ts`, and this document.

Modified: Hono app assembly, auth user schema/barrel, root layout, header, homepage CTA, environment examples, package scripts, existing auth-schema tests, and migration journal. Existing unrelated working-tree changes were preserved.

Validation commands:

```sh
npm run typecheck
npm run lint
npm run db:generate
npm run test:unit
npm run build:web
npm run test:auth:integration
npm run test:auth:browser
```

Browser verification requires the installed Playwright Chromium browser (`npx playwright install chromium` if needed). The browser script starts the real Vite/Worker monolith on `localhost:5186` using isolated temporary D1 storage and generated disposable credentials. It cleans up the server and test database afterward. It does not read or change the developer's `.dev.vars` or seed the real administrator. Integration checks cover signup, role-injection rejection, normalized username uniqueness, session cookies, logout, email/username login, CSRF, server admin guards, repeated seed runs, and generated OAuth redirects. Unit tests cover application validation, modal state, authorization, and migration preservation. Browser checks cover forms, focus, desktop/mobile layout, identity updates, and reload persistence.

References: [Better Auth Hono integration](https://better-auth.com/docs/integrations/hono), [username plugin](https://better-auth.com/docs/plugins/username). Installed package source/types are authoritative for this implementation.

## Local validation outcome

The local database contained the legacy `campaigns` table from `0001_application.sql`, which conflicts with the new `0001_complete_black_widow.sql`. The general `db:migrate:local` command therefore remains blocked at that campaign migration. The auth migrations (0002 and 0003) were applied directly and recorded in the local D1 ledger after verifying that no auth tables existed. The old campaign table/data were preserved, and its incompatible migration was not marked complete. Fresh databases can use the ordinary migration command; this existing database needs a separate campaign data conversion before the full migration chain can run.

Build, TypeScript, 28 unit tests, isolated D1 integration, and real Worker browser authentication checks passed. Lint has only the pre-existing Button Fast Refresh warning. `db:generate` reports no schema drift. Focused formatting was applied. The browser bundle was checked against configured secret values with no matches. `.dev.vars` is ignored by Git.

The requested real administrator was created in local D1 using the private `SEED_ADMIN_PASSWORD`. The configured local `BETTER_AUTH_SECRET` was too short and was replaced with a generated 48-byte random secret in ignored `.dev.vars`; the seed password was preserved. Google credentials are now configured locally; Discord credentials are still empty. Provider consent and real OAuth callback completion remain unverified.

Final live verification against `http://localhost:5173` passed for the real seeded administrator: username login, administrator UI, `/api/admin/access` authorization, logout, and Google authorization redirect generation using the configured client. A second local seed run confirmed the same account without creating a duplicate. Real provider consent/callback completion and remote seeding were not performed.
