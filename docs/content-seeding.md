# Content seeding

```sh
npm run db:seed:local
npm run db:seed:remote
```

The runner asks for confirmation once for the entire invocation. Declining makes
no database changes. The local command includes pending local migrations in that
confirmation; the remote command never applies migrations. Child Wrangler commands
run noninteractively. Pass `-- --yes` to either npm command for unattended execution.

## Systems and seed groups

Each system has its own folder containing seed-group folders:

```text
seeds/
  dnd3-5/
    seed-order.json
    phb-classes/
      00-classes.sql
    phb-races/
      00-races.sql
  another-system/
    core-rules/
      00-rules.sql
```

With no filters, the runner discovers every system and all its groups. Select a
system with repeatable `--system` arguments, or specific groups with repeatable
`--seed` arguments:

```sh
npm run db:seed:local -- --seed phb-classes --seed phb-races
npm run db:seed:local -- --system dnd3-5
npm run db:seed:local -- --seed dnd3-5/phb-classes
npm run db:seed:local -- --system another-system --seed core-rules
```

Short group names still work when unique across the selected systems. If multiple
systems use the same group name, specify `--system` or the qualified
`--seed system/group`. Selecting a group does not automatically select dependencies.

Systems run alphabetically. Within each system, an optional `seed-order.json`
contains an array of group names in dependency order. Unlisted groups run afterward
alphabetically, and missing future groups in the order are ignored. SQL files
within each group are discovered recursively in filename order. The D&D 3.5
manifest preserves the previous runner's dependency order. To add another system,
create its group folders and SQL files, plus an order manifest if needed; no runner
code changes are required. Place SQL files inside group folders.

## Persistent history

The script owns a `codex_seed_history` table in the target D1 database, separate
from the application schema and Drizzle migrations. Each SQL file is identified
by its path relative to `seeds/`, including the system prefix and using forward
slashes (for example, `dnd3-5/phb-classes/00-classes.sql`). Local and remote databases
have independent histories; switching machines retains the remote history.

The `content_hash` column stores a SHA-256 checksum of the latest recorded file
contents. Unchanged files are skipped; new files and edited files are applied in
the existing dependency order. Windows and Unix line endings are treated as
equivalent. Other changes, including comments, change the checksum. Reverting a
file to older contents also counts as an update relative to its latest record.

An update executes the entire SQL file. Use upserts or explicit updates in seeds
to change existing rows; removing an INSERT from a file does not delete a row
already in the database. The runner does not rewrite the SQL or infer deletions.

A database claim is committed **before** executing each new or changed file.
Concurrent invocations cannot both claim the same change. Successful attempts become
`applied` in the same D1 transaction as the seed SQL, so an interruption after the
commit cannot leave successfully applied content marked unfinished. The runner
uses a temporary SQL file for this batch and removes it afterward; source seed
files stay unchanged. Explicit historical records become `adopted`. Each path has
one row representing its latest attempt, with its checksum, status and timestamps.

A failed or interrupted attempt that did not commit stays `started`. If a network
response is lost after commit, the next run sees `applied` and skips the file.
Subsequent runs selecting a file still marked `started` stop
before executing any further seeds. Inspect the data and finish any necessary
repair manually, then change that history row to `applied` with a completion time
only after verifying the seed's intended effects. There is no automatic retry or
force-rerun option. This intentionally favors at-most-once attempts over retrying
a version whose effects may already exist. Editing a file with an unfinished
attempt does not clear that blocker.

Keep this history with database backups. Deleting the history, recreating the
database, or executing files directly through Wrangler bypasses this protection.

## Moving the existing D&D seeds

The runner automatically renames completed old history paths such as
`phb-classes/00-classes.sql` to `dnd3-5/phb-classes/00-classes.sql` for selected D&D
groups, retaining their hashes, statuses and timestamps. Moving the folders does
not replay unchanged SQL. This works separately on local and remote databases.

Unfinished old claims remain at their original path and still block the associated
D&D seed, so an older process can complete its original claim. If both old and new
paths already have records, the runner stops for reconciliation instead of deleting
either record or guessing which one is authoritative.

## Upgrading older path-only history

The runner automatically adds `content_hash` to existing history tables. Completed
records without a checksum receive the checksum of their current file as a
baseline without rerunning SQL. Their original timestamps and status are retained.
The runner logs each baseline it establishes. Subsequent edits are detected.

The old history did not save file contents, so edits made before this baseline
cannot be distinguished from the previously applied file. Baseline a database
before editing seeds when upgrading from the old runner. Local and remote databases
must each establish their own baseline. Unfinished records remain blocked and are
never silently marked complete during this upgrade.

## Databases seeded before history existed

The previous script did not record executed files, so past execution cannot be
reliably inferred from existing content. Before normal seeding on such a database,
record the directories you have verified were already fully applied:

```sh
npm run db:seed:local -- --mark-applied --seed phb-classes --seed phb-races
npm run db:seed:remote -- --mark-applied --seed phb-classes --seed phb-races
```

`--mark-applied` records the current checksums of new or changed selected files
without executing their SQL or applying migrations. It asks once and supports
`--yes`. Omit `--seed` only
if **every current SQL file** has already been applied. Existing unfinished claims
are never overwritten by this option. For a partially applied directory, reconcile
individual history rows against verified files before normal seeding; do not mark
the entire directory applied blindly.

Administrator account seeding (`db:seed:admin`) is a separate Better Auth workflow;
see [authentication setup](authentication.md).

Wrangler's SQL execution flags are documented in the
[D1 command reference](https://developers.cloudflare.com/workers/wrangler/commands/d1/#execute).
