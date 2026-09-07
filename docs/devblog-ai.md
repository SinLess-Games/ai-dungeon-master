# Weekly AI devblog writer

The Endless Codex can prepare one evidence-grounded development journal every week and save it into the existing devblog.

## Cost model

Production uses **Cloudflare Workers AI** through the `AI` binding in `wrangler.jsonc`. No OpenAI API key is required for the default setup.

The default model is:

```text
@cf/google/gemma-4-26b-a4b-it
```

Cloudflare provides a daily free Workers AI allocation. The weekly writer performs one generation per project week unless an administrator manually triggers that week's generation first, so normal weekly use is intended to stay within that free allocation. Cloudflare can change quotas/models over time; check the Workers AI dashboard if a generation fails because the account reached its allocation or the selected model changed availability.

`AI_API_KEY` and `AI_BASE_URL` remain supported only as an optional OpenAI-compatible fallback for development or non-Cloudflare deployments.

## Schedule

Cloudflare runs the Worker cron at `01:00 UTC` every Monday. In the project's `America/Denver` calendar this is Sunday evening. The generated post is keyed to that local Sunday, so the scheduled run and a manual run on the same Sunday cannot create duplicates.

The feature is enabled by default in `wrangler.jsonc` and defaults to **draft-only**. Set `DEVBLOG_AI_AUTO_PUBLISH=true` only if you intentionally want the AI output published without review.

## Source material

The writer uses only supplied evidence:

- commits from the previous seven days,
- pull requests updated during the previous seven days,
- non-PR issues updated during the previous seven days,
- `roadmap.md`, when available,
- titles/excerpts of the five most recent published devblog posts,
- optional weekly notes entered by an administrator for a manual run.

If GitHub reports no meaningful activity in the window, the writer refuses to invent an article.

The private GitHub repository is read through the GitHub REST API using `GITHUB_TOKEN`. Use a fine-grained token scoped only to `SinLess-Games/ai-dungeon-master` with read-only Contents, Pull Requests, Issues, and Metadata access. Creating and using that token does not require a paid GitHub plan.

## AI provider

The normal production path is:

```text
Cloudflare Worker
  -> env.AI
  -> @cf/google/gemma-4-26b-a4b-it
```

The Worker AI binding is configured in `wrangler.jsonc`:

```jsonc
"ai": {
  "binding": "AI"
}
```

No `AI_API_KEY` is needed when this binding is present.

Optional override:

```text
AI_DEVBLOG_MODEL=@cf/google/gemma-4-26b-a4b-it
```

Optional OpenAI-compatible fallback:

```text
AI_API_KEY=
AI_BASE_URL=
AI_DEVBLOG_MODEL=
```

Never use a `VITE_` variable for the fallback API key or GitHub token.

## Production configuration

For the free production setup, only the private GitHub repository credential needs to be added manually:

```sh
npx wrangler secret put GITHUB_TOKEN
```

Then deploy the current `wrangler.jsonc` so the Workers AI binding is attached:

```sh
npm run deploy
```

You do **not** need to run:

```text
wrangler secret put AI_API_KEY
```

for the default Cloudflare Workers AI configuration.

`GITHUB_REPOSITORY`, `DEVBLOG_AI_ENABLED`, `DEVBLOG_AI_AUTO_PUBLISH`, and `AI_DEVBLOG_MODEL` have non-secret defaults in `wrangler.jsonc`.

Scheduled generation needs an administrator to own the generated post. If `DEVBLOG_AI_AUTHOR_EMAIL` is set, it must match an existing admin account. If omitted, the oldest admin account is used.

## Admin workflow

Open:

```text
/user/admin
  -> Devblog studio
  -> AI Writer
```

The panel reports AI and GitHub configuration independently. A correct free production setup should show:

```text
Provider: Cloudflare Workers AI
AI: ready
GitHub: ready
Using the Cloudflare Workers AI free allocation.
```

Manual generation accepts optional weekly notes for context that Git history cannot explain. The notes are sent to the model for that run only; they are not persisted separately.

The generated post uses the normal `devblog_posts` table and can immediately be edited in Devblog Studio. No second CMS or AI-specific post table exists.

## Deduplication

Each local project week uses the deterministic slug:

```text
weekly-dev-update-YYYY-MM-DD
```

where the date is the Sunday starting that project week. If a post with that slug already exists, scheduled/manual generation skips instead of creating a duplicate.

## Safety

- The AI never receives a database connection or GitHub credential.
- GitHub and D1 reads happen on the Worker before the prompt is built.
- The prompt instructs the model to use only supplied evidence and not invent completed features, metrics, release dates, gameplay behavior, or roadmap promises.
- The generated JSON is validated before insertion.
- The default result is a draft.
- Manual generation is admin-only and same-origin protected.
- Scheduled failures are logged and do not create partial posts.
- GitHub access remains read-only.

## Validation

Before deploying:

```sh
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

Then deploy:

```sh
npm run deploy
```

After deployment, sign in as an admin, open the AI Writer tab, confirm it reports both AI and GitHub as ready, and choose **Generate now** to create the first week's draft immediately.
