# Cloudflare Workers AI setup

The Endless Codex uses **Cloudflare Workers AI through a Worker binding** for the AI Dungeon Master and devblog generation. The production path does **not** require an OpenAI API key.

## Repository configuration

`wrangler.jsonc` already contains the Workers AI binding:

```jsonc
"ai": {
  "binding": "AI"
}
```

The binding is available to the Worker as `env.AI`.

The default models are also configured in `wrangler.jsonc`:

```jsonc
"vars": {
  "AI_DEVBLOG_MODEL": "@cf/google/gemma-4-26b-a4b-it",
  "AI_GAME_MODEL": "@cf/google/gemma-4-26b-a4b-it"
}
```

`AI_GAME_MODEL` is used for campaign/OOC Dungeon Master replies. `AI_DEVBLOG_MODEL` is used for devblog generation.

The application calls the binding through `src/infrastructure/ai/openaiCompatible.ts`. Cloudflare Workers AI is preferred when `env.AI` is present. The optional OpenAI-compatible API variables are only a fallback.

Campaign narration and turn planning include explicit [campaign length and pacing guidance](campaign-duration.md) from saved campaign settings.

## One-time Cloudflare setup

1. Sign in to the Cloudflare account that owns `the-endless-codex`.
2. Open **Workers & Pages** and select **the-endless-codex**.
3. Open the Worker's **Bindings** section and confirm that a **Workers AI** binding named `AI` exists after deployment.
4. Open **AI > Workers AI** in the account dashboard and confirm Workers AI is available for the account.
5. If usage may exceed Cloudflare's daily free Workers AI allocation, enable the Workers Paid plan/billing for the account.

The binding is source-controlled in `wrangler.jsonc`, so a normal Wrangler/Git deployment should create/update it. Do not add an API key just to use the Workers AI binding.

## Authenticate Wrangler

From the project directory:

```bash
npx wrangler login
```

Complete the browser authorization for the Cloudflare account that owns the Worker.

Verify the authenticated account:

```bash
npx wrangler whoami
```

## Generate binding types

Run this whenever Wrangler bindings change:

```bash
npm run cf:typegen
```

## Validate before deploying

```bash
npm run deploy:check
```

This runs the application build/typecheck and a Wrangler dry-run.

## Deploy

```bash
npm run deploy
```

The application is configured for the custom domain:

```text
https://endless-codex.sinlessindustries.com
```

After deploy, open an active AI-DM campaign and send a Campaign or OOC DM message. A successful Dungeon Master reply proves that the `AI` binding and `AI_GAME_MODEL` are working together.

## Changing the game model

Change only `AI_GAME_MODEL` if the Dungeon Master should use a different Workers AI model:

```jsonc
"AI_GAME_MODEL": "@cf/google/gemma-4-26b-a4b-it"
```

Then deploy again. Keep the `@cf/...` model identifier exactly as Cloudflare documents it.

The devblog model can be changed independently with `AI_DEVBLOG_MODEL`.

## Production recommendation

For MVP, use the direct Workers AI binding exactly as the repository is currently configured:

```text
Endless Codex Worker -> env.AI -> Workers AI model
```

Do not add AI Gateway until you specifically need gateway analytics, caching, centralized rate controls, or multi-provider routing. Keeping the first production path direct removes another moving part from the campaign-play MVP.

## Optional OpenAI-compatible fallback

The application also supports an optional external OpenAI-compatible provider using:

```text
AI_API_KEY
AI_BASE_URL
```

This is a fallback, not required for Cloudflare Workers AI. Store `AI_API_KEY` as a Wrangler secret rather than a plain `vars` entry:

```bash
npx wrangler secret put AI_API_KEY
```

Do not commit secrets to `wrangler.jsonc`, `.dev.vars`, or the repository.

## Local development

Workers AI calls can access the real Cloudflare AI service during local development and can consume Workers AI usage. Authenticate Wrangler before testing AI locally.

Start the application normally:

```bash
npm run dev
```

For deterministic automated tests, Campaign Play E2E uses a local OpenAI-compatible mock instead of consuming live Workers AI inference.

## Troubleshooting

### `Workers AI binding is unavailable`

- Confirm `wrangler.jsonc` contains `"ai": { "binding": "AI" }`.
- Redeploy the Worker.
- Confirm the deployed Worker lists a Workers AI binding named `AI`.
- Run `npx wrangler whoami` and make sure Wrangler is authenticated to the correct Cloudflare account.

### `No AI provider is configured`

The Worker runtime did not receive the `AI` binding and no fallback `AI_API_KEY` was configured. Fix the binding instead of adding an unnecessary external API key for the normal production path.

### Model not found / unsupported model

Confirm `AI_GAME_MODEL` is a current Cloudflare Workers AI model identifier. The repository currently uses:

```text
@cf/google/gemma-4-26b-a4b-it
```

### AI usage limit reached

Check **AI > Workers AI** usage in the Cloudflare dashboard. Free allocation resets daily. Enable paid Workers usage if production traffic needs more inference capacity.

### Campaign message saves but no DM reply appears

The message can still persist even when AI generation fails. Check Worker logs for the AI provider error and verify the binding/model configuration first.

## Relevant application files

- `wrangler.jsonc` — AI binding and selected model IDs
- `src/infrastructure/ai/openaiCompatible.ts` — Workers AI/provider adapter
- `src/modules/campaigns/server/playMessageRoutes.ts` — campaign and private OOC DM generation
- `src/server/app.ts` — Worker binding types/routes
- `tests/e2e/campaign-play.e2e.mjs` — deterministic Campaign Play AI verification
