-- Better Auth 1.7.3+ stops writing accounts.issuer. SQLite cannot drop NOT NULL
-- in place, so drop the 1.7.0–1.7.2 column. Identity is provider_id + account_id.
-- Resolve duplicate (provider_id, account_id) pairs before applying this file;
-- the new unique index fails closed when those duplicates exist.
DROP INDEX `accounts_issuer_account_id_uq`;
--> statement-breakpoint
ALTER TABLE `accounts` DROP COLUMN `issuer`;
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_account_id_uq` ON `accounts` (`provider_id`, `account_id`);
