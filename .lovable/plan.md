# Plan: Enable Live Stripe Payments, Security Scan, and Publish

## Goal
Flip the Stripe integration from sandbox to live so the Multiplayer Pass charges real money, then run a fresh security scan and publish The Endless Codex.

## Current State
- Stripe go-live is at **Step 1: Connect your sandbox to a Stripe account** (`in_progress`). Steps 2–5 are locked until Step 1 completes.
- Security scan is currently running/supply-chain only; a fresh comprehensive scan is needed.
- Project is not yet published but visibility is set to public.

## Steps

### 1. Complete Stripe account claim and go-live onboarding
- Open the Payments tab and use the Stripe claim link for sandbox account `acct_1UBgvX7B32XyNZPl`.
- Create or connect an existing Stripe live account.
- Verify email and complete Stripe's business/bank/security onboarding.
- Install the Lovable app on the live Stripe account when prompted.
- This is a **user-driven Stripe dashboard flow**; the agent can only guide and verify status.

### 2. Provision live keys and run readiness check
- After onboarding + app install, Lovable automatically provisions live API keys and webhooks.
- Poll the Payments go-live status until Step 4/5 show completed.
- Run the automated readiness check to confirm products, prices, and webhooks are live-ready.

### 3. Verify Multiplayer Pass live catalog
- Confirm the Multiplayer Pass products (`multiplayer_monthly` and `multiplayer_yearly`) and prices exist in the live Stripe environment.
- Update or sync product/price metadata if the live catalog differs from sandbox.
- Verify checkout/session creation routes use the correct live price IDs and `StripeEnv = 'live'`.

### 4. Run fresh security scan
- Trigger a comprehensive security scan covering backend, RLS, dependencies, and exposed data.
- Review findings and fix any issues before publishing.

### 5. Publish
- Once go-live and security scan are clean, publish the app.
- Confirm the published `/upgrade` page correctly shows live Multiplayer Pass options and billing portal.

## Outcome
Real-money Multiplayer Pass subscriptions are active, security scan is clean, and the app is published.
