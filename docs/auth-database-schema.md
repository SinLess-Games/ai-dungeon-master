# Better Auth database schema

> This records the original core/Admin schema. The completed [authentication integration](authentication.md) adds username/displayUsername fields and a fifth rate-limit table in migration 0003. Use that guide for current runtime configuration and setup.

Implemented against the installed `better-auth` **1.7.2**, `@better-auth/core` **1.7.2**, `@better-auth/drizzle-adapter` **1.7.2**, and Drizzle **0.45.2**. The schema contains exactly four authentication tables; there is no separate administrator identity or RBAC table.

## Files

- `src/infrastructure/database/schema/auth/user.ts`: user identity, role and ban state; `User`, `NewUser`, `userRoles`, `UserRole`.
- `src/infrastructure/database/schema/auth/session.ts`: sessions and impersonation marker; `Session`, `NewSession`.
- `src/infrastructure/database/schema/auth/account.ts`: provider identities and credential/OAuth persistence; `Account`, `NewAccount`.
- `src/infrastructure/database/schema/auth/verification.ts`: verification challenges; `Verification`, `NewVerification`.
- `src/infrastructure/database/schema/auth/index.ts`: all exports and centralized Drizzle 0.45 user/session/account relations, avoiding table import cycles.
- `src/infrastructure/database/schema/index.ts`: added the auth export, preserving other exports.
- `drizzle/0002_better_auth.sql`, `drizzle/meta/0002_snapshot.json`, `drizzle/meta/_journal.json`: generated auth migration and metadata. Earlier migrations remain intact.
- `tests/unit/auth-schema.test.ts`: six compatibility/constraint tests, including a real Better Auth/Admin flow.
- This document.

## Exact fields

TypeScript fields map to snake_case SQLite columns; the tables are `users`, `sessions`, `accounts`, and `verifications`.

| Model        | Core fields                                                                                                                                                                         | Admin plugin fields                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| User         | `id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`                                                                                                           | `role`, `banned`, `banReason`, `banExpires` |
| Session      | `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`, `createdAt`, `updatedAt`                                                                                            | `impersonatedBy`                            |
| Account      | `id`, `userId`, `accountId`, `providerId`, `accessToken`, `refreshToken`, `idToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `scope`, `password`, `createdAt`, `updatedAt` | None                                        |
| Verification | `id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt`                                                                                                                  | None                                        |

Every ID is required text supplied by Better Auth. There is no Drizzle UUID default: the installed adapter generates IDs, and its default strings need not be UUIDs. A future Better Auth `advanced.database.generateId: "uuid"` setting would remain compatible.

All dates use integer `timestamp_ms`, preserving JavaScript `Date` milliseconds. Generated date defaults are `(cast(unixepoch('subsecond') * 1000 as integer))`. User and verification `updatedAt` have SQL defaults and Drizzle update hooks. Session and account `updatedAt` match the reference's required date/update hook without a SQL default; Better Auth supplies their values, and Drizzle's hook also supplies an omitted insert value. Raw SQL importers must supply these two required timestamps. Raw SQL updates do not run Drizzle hooks.

Boolean fields use SQLite integer boolean mode. `emailVerified` is required and defaults false. `banned` remains nullable with default false, as in the Admin plugin. Ban reason and expiration are nullable. No cross-field ban constraint interferes with the plugin's ban/unban lifecycle.

## Roles

`userRoles = ["user", "admin"] as const`. `users.role` is required, defaults to `user`, and has `CHECK (role IN ('user', 'admin'))`. An administrator is a user row with `role = 'admin'`.

The installed Admin schema declares role optional text; its create hook supplies `defaultRole`. Its endpoints also optionally support comma-joined multiple roles, but do not require them. This application deliberately tightens storage to exactly one of the two requested roles. Global role-setting endpoints must accept a single supported role at the future application boundary; arrays/custom roles are unsupported here and rejected by the database. Campaign permissions, subscription tiers and game roles are not auth roles.

## Every index and relationship

All four tables have text primary keys. Additional indexes are:

| Index                             | Columns                     | Unique |
| --------------------------------- | --------------------------- | ------ |
| `users_email_uq`                  | `email`                     | Yes    |
| `sessions_token_uq`               | `token`                     | Yes    |
| `sessions_user_id_idx`            | `user_id`                   | No     |
| `sessions_expires_at_idx`         | `expires_at`                | No     |
| `accounts_provider_account_id_uq` | `provider_id`, `account_id` | Yes    |
| `accounts_user_id_idx`            | `user_id`                   | No     |
| `verifications_identifier_idx`    | `identifier`                | No     |
| `verifications_expires_at_idx`    | `expires_at`                | No     |

`users_role_valid`, `users_email_verified_boolean`, and `users_banned_boolean` are the added CHECK constraints. Email uniqueness uses the reference's ordinary SQLite text semantics; Better Auth normalizes email during account flows. There is no additional name/email format constraint that could reject values accepted by the installed package.

`sessions.userId` and `accounts.userId` reference `users.id` with `ON DELETE CASCADE`. Deleting a user removes their owned sessions/accounts only. This task does not retrofit auth foreign keys or cascades into campaigns, feedback or D&D content.

`impersonatedBy` is nullable text without an FK, matching the Admin plugin. It retains the administrator's ID if that administrator is removed, rather than setting the marker to NULL and making an impersonated session appear ordinary. Better Auth owns impersonation authorization and lifecycle semantics.

Verification identifiers are deliberately not unique or user FKs: challenges may exist before a user and multiple records may share an identifier. The expiry indexes support cleanup without adding cleanup logic to the schema.

## Installed-package verification and differences from older examples

Inspected the installed core schemas and `get-tables` implementation, Admin schema/create hooks/role endpoints, adapter ID/date behavior and Drizzle generation support. The bundled `generateDrizzleSchema` function was invoked with the Admin plugin and `usePlural: true`, writing a reference to `/tmp/endless-auth-reference.ts`. This was local reference generation, with no package installation or production configuration writes.

The installed conventional adapter does not expose a `createSchema` implementation and there is no installed auth CLI binary. Its package does contain a callable generator bundle used for Relations v2. That reference supplies authoritative table fields, defaults, indexes and millisecond types. Its `defineRelationsPart` output is for newer Drizzle; this project uses the equivalent `relations` API supported by 0.45.2. The tests compare all four implemented models against `getAuthTables` from the installed package and exercise joins through the real conventional adapter.

Specific decisions:

- Better Auth 1.7.3+ does not write `issuer`. `drizzle/0028_drop_account_issuer.sql` drops that 1.7.0–1.7.2 column. The identity key is **providerId + accountId**. The same provider subject cannot be stored twice; a different provider may reuse the same subject string.
- All dates use **milliseconds**, unlike the D&D schema's seconds.
- The single-role constraint/default/NOT NULL requirement intentionally strengthens the optional Admin role field for this application's policy.
- IDs explicitly use NOT NULL to avoid SQLite's nullable text-primary-key behavior. Their generation remains owned by Better Auth.
- Expiration indexes and boolean checks are additional compatible constraints; index names use snake_case.
- No additional core table is required by this configuration. Database-backed rate limiting or other plugins would need their own schema if enabled later.

## Future configuration

No existing Better Auth server/client configuration or `src/modules/auth/` implementation was found. None was added to production. The [official adapter documentation](https://better-auth.com/docs/adapters/drizzle) documents plural table mapping; the [Admin plugin documentation](https://better-auth.com/docs/plugins/admin) documents enabling the plugin.

The future request/environment-scoped factory should pass its Drizzle D1 client to:

```ts
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import * as authSchema from "@/infrastructure/database/schema/auth";

// Inside the future factory's betterAuth options, using its supplied database:
{
  database: drizzleAdapter(database, {
    provider: "sqlite",
    usePlural: true,
    schema: authSchema,
  }),
  plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] })],
}
```

Include the whole auth barrel in Drizzle's schema, as the existing `createDatabase(binding)` now does through the root barrel. There is no static D1 connection. `adminClient()` can be added when the auth client is implemented. Single-role validation belongs at that boundary; do not expose unrestricted multi-role setters as an application feature.

Account, session and verification inferred types are internal persistence types, not public DTOs. Better Auth manages password hashing and provider credentials; application responses must use its filtered outputs or purpose-specific DTOs. No custom password/token/OAuth handling, JSON secrets or production Node-only database dependency was introduced.

## Validation

The tests apply all migrations to in-memory SQLite with foreign keys enabled. The real Better Auth test performs email/password signup, checks the credential provider key and hashed password storage, signs in, reads sessions with joins enabled, changes roles through Admin, impersonates a user, bans them and verifies denied sign-in, then unbans them. Other cases cover defaults, supported roles, duplicate emails/tokens, provider-identity collisions, ownership cascades, preserved impersonation markers, independent challenges and exact millisecond round trips. Node's built-in SQLite is used only in tests.

Validation completed: focused `npm run format`, `npm run lint` (only the existing button Fast Refresh warning), `npm run db:generate`, all 22 unit tests, and the isolated strict database/test TypeScript check. Full-project typechecking initially found the existing missing route tree and `cn` import; those were subsequently resolved while fulfilling the user's React/Hono monolith request, and `npm run build` now passes its full TypeScript check. No remote migration was applied.
