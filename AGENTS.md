<!-- LOVABLE:BEGIN -->

# Repository guide

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

<!-- CODEX:BEGIN -->

## Project and layout

- The Endless Codex is a D&D 3.5 game with an AI dungeon master, character
  management, campaigns, worlds, maps, and a rules wiki. Preserve the 3.5 ruleset.
- Stack: React 19, TypeScript, TanStack Start/Router, Vite, Tailwind CSS 4,
  shadcn/Radix UI, Cloudflare D1, Supabase Auth/Storage, and Stripe. This is a TanStack Start app.
- `src/routes/`: file-based pages and API handlers. Follow `src/routes/README.md`;
  keep the root layout in `__root.tsx` and do not hand-edit `src/routeTree.gen.ts`.
- `src/components/`: application UI; `src/components/ui/`: shared UI primitives.
- `src/lib/rules/`: game rules and character calculations; `src/lib/wiki/`: reference data.
- `src/prompts/`: DM, world-building, NPC, dungeon, economy, and cartography prompts.
- `src/lib/storage.ts`: local persistence; `src/lib/cloud-sync.ts`: offline-first
  D1 synchronization through authenticated server functions. Preserve saved-data compatibility
  and deletion handling.
- `src/integrations/d1/`: server-only queries and ownership/admin enforcement;
  `migrations/`: active D1 migrations. `wrangler.toml` defines the `DB` binding.
- `src/integrations/supabase/`: retained auth/storage clients and row types;
  `supabase/migrations/`: historical PostgreSQL migrations, not applied to D1.
- `src/lib/ai-gateway.server.ts`: Lovable AI provider; `src/routes/api/chat.ts`: DM API.
- `src/server.ts`: SSR error wrapper. `roadmap.md` and `.lovable/plan/` provide
  product context; check the code before assuming a roadmap item is implemented.

## Development commands

Use npm, as documented in the README. Both npm and Bun lockfiles exist; avoid
incidental dependency or lockfile churn and preserve unrelated working-tree edits.

- `npm run db:migrate:local`: initialize/update the local D1 database.
- `npm run dev`: local development server with a local D1 proxy.
- `npm run build`: production build; `npm run build:dev`: development-mode build.
- `npm run lint`: ESLint, including Prettier rules.
- `npx tsc --noEmit`: TypeScript check (there is no dedicated script).
- `npm run test:unit`: Vitest unit tests in `tests/unit/` using jsdom.
- `npm test`: unit tests with coverage and configured coverage thresholds.
- `npm run test:e2e`: Playwright Chromium tests. Start the app separately; the
  configuration defaults to `http://localhost:8080`. Override with `E2E_BASE_URL`;
  `E2E_CHROME_PATH` can select an existing browser. Authenticated tests use the
  session environment variables described in `tests/e2e/helpers.ts`.

Run checks appropriate to each change and report pre-existing failures separately.
Avoid repository-wide `npm run format` for focused changes; format touched files.

## Implementation conventions

- Use `@/` for imports from `src/` and follow the existing local code patterns.
- Respect strict TypeScript settings, including unchecked indexed access and exact
  optional properties. Prettier uses double quotes, semicolons, trailing commas,
  and a 100-character print width.
- The Lovable Vite wrapper already supplies React, TanStack Start, Tailwind,
  path aliases, and Nitro integration. Read `vite.config.ts` before changing it;
  do not register duplicate plugins.
- Keep server credentials and privileged operations in server code. Follow existing
  `*.server.ts` and TanStack server-function patterns; do not import Next.js's
  `server-only` package.
- Preserve SSR-safe access to browser APIs and the offline-first storage flow.
- Reuse the existing UI primitives and theme in `src/styles.css`.
- Do not print or commit secret values from environment files or session variables.

<!-- CODEX:END -->
