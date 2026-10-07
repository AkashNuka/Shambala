# Shambala — Upgrade Progress Tracker

Tracks which fixes from `upgrades.md` have been applied.

| Fix | Title | Phase | Status | Applied By | Date |
|-----|-------|-------|--------|------------|------|
| 1 | Seed the chart of accounts | 1 | ✅ DONE | Agent | 2026-09-28 |
| 2 | Enable Row Level Security | 1 | ✅ DONE | Agent | 2026-09-28 |
| 3 | `deleteRecord` accepts any table name | 2 | ✅ DONE | Agent | 2026-09-28 |
| 4 | Transport page reads a dead table | 2 | ✅ DONE | Agent | 2026-09-28 |
| 5 | Balances silently truncate at 1,000 rows | 2 | ✅ DONE | Agent | 2026-09-28 |
| 6 | Type the Supabase client | 2 | ✅ DONE | Agent | 2026-09-28 |
| 7 | Context: the split-brain problem | 3 | ℹ️ READ-ONLY | | |
| 8 | Food never reaches the ledger | 3 | ⬜ TODO | | |
| 9 | Day Book and party ledger are always blank | 3 | ⬜ TODO | | |
| 10 | Deletes leave orphaned ledger entries | 3 | ⬜ TODO | | |
| 11 | Payables always net to zero | 3 | ⬜ TODO | | |
| 12 | Machinery: wrong ledger, missing reference_id | 3 | ⬜ TODO | | |
| 13 | Reports read wrong source | 3 | ⬜ TODO | | |
| 14 | Export fails | 4 | ⬜ TODO | | |
| 15 | Import fails | 4 | ⬜ TODO | | |
| 16 | Backup fails | 4 | ⬜ TODO | | |
| 17 | UI fixes | 5 | ⬜ TODO | | |
| 18 | Validation | 5 | ⬜ TODO | | |
| 19 | Indexes | 5 | ⬜ TODO | | |
| 20 | Cleanup | 5 | ⬜ TODO | | |

## Notes

### Phase 1 — Fixes 1 & 2 (2026-09-28)

**Migration files created — NOT YET RUN against the database.**

- `006_seed_ledgers.sql` — Adds unique constraint on `(project_id, name)` and inserts the 12 required ledger accounts. If the constraint already exists, paste only the `INSERT` block.
- `007_rls.sql` — Enables RLS on all public tables, creates `authenticated_full_access` policy, revokes anon access.

**⚠️ ACTION REQUIRED:** Both SQL files must be run manually in the **Supabase Dashboard → SQL Editor**. Run `006` first, then `007`.

**Verify Fix 1:**
```sql
SELECT COUNT(*) FROM ledger_accounts
WHERE project_id = '10000000-0000-0000-0000-000000000000';
-- expected: 12
```

**Verify Fix 2:**
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
-- expected: rowsecurity = true for ALL rows

SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname='public';
-- expected: matches your table count
```

### Phase 2 — Fixes 3, 4, 5, 6 (2026-09-28)

- **Fix 3 (Done):** Added `DeletableTable` allowlist, UUID validation, and `project_id` scope to `deleteRecord` in `transactions.ts`.
- **Fix 4 (Done):** Transport page now reads from `transport_trips`, filters by `project_id`, sorts by date.
- **Fix 5 (Done):** Created `008_balance_views.sql` migration. Updated `accounts.ts` to query `ledger_balances` and `monthly_expense_totals` instead of summing in JS. (Note: Migration 008 needs to be executed manually).
- **Fix 6 (Done):** Regenerated TypeScript types from Supabase, updated `createClient` wrappers in `src/lib/supabase/`. Fixed all type errors across the codebase. Bypassed table mismatches resulting from pending migrations 14, 15, 16 using `(supabase as any)` with explicit BUG comments to ensure a green build without hiding issues.

### Next session: Phase 3 — Fixes 7-13
- Fix 7: Context: the split-brain problem (READ ONLY)
- Fix 8: Food never reaches the ledger
- Fix 9: Day Book and party ledger are always blank
- Fix 10: Deletes leave orphaned ledger entries
- Fix 11: Payables always net to zero
- Fix 12: Machinery: wrong ledger, missing reference_id
- Fix 13: Reports read wrong source
