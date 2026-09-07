# Weekly AI devblog writer

The Endless Codex can prepare one evidence-grounded development journal every week and save it into the existing devblog.

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

The private GitHub repository is read through the GitHub REST API using `GITHUB_TOKEN`. Use a fine-grained token or GitHub App credential scoped only to the repository with read-only Contents, Pull Requests, Issues, and Metadata access.

## AI provider

The writer uses an OpenAI-compatible `POST /chat/completions` endpoint.

Server-only configuration:

```text
AI_API_KEY=
AI_BASE_URL=
AI_DEVBLOG_MODEL=
```

`AI_BASE_URL` defaults to `https://api.openai.com/v1` and `AI_DEVBLOG_MODEL` defaults to `gpt-5-mini` when omitted. Override both when using another compatible provider.

Never use a `VITE_` variable for the API key or GitHub token.

## Production configuration

Set the secrets interactively so they do not land in shell history or committed files:

```sh
npx wrangler secret put AI_API_KEY
npx wrangler secret put GITHUB_TOKEN
```

Optional production overrides can also be configured through Worker environment variables/secrets:

```text
AI_BASE_URL
AI_DEVBLOG_MODEL
DEVBLOG_AI_AUTHOR_EMAIL
```

`GITHUB_REPOSITORY`, `DEVBLOG_AI_ENABLED`, and `DEVBLOG_AI_AUTO_PUBLISH` have non-secret defaults in `wrangler.jsonc`.

Scheduled generation needs an administrator to own the generated post. If `DEVBLOG_AI_AUTHOR_EMAIL` is set, it must match an existing admin account. If omitted, the oldest admin account is used.

## Admin workflow

Open:

```text
/user/admin
  -> Devblog studio
  -> AI Writer
```

The panel shows whether the writer is configured, the source repository/model, this week's generated post, and a **Generate now** button.

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

After deployment, sign in as an admin, open the AI Writer tab, confirm it reports `configured`, and choose **Generate now** to create the first week's draft immediately.
