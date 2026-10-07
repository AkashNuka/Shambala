# Shambala — Agent Fix Guide 

 

**Repo:** `github.com/AkashNuka/Shambala` · **App root:** `shambala/` — run all npm commands from there. 

 

## Rules for every agent 

 

1. **One fix per session.** Each is self-contained. Don't bundle. 

2. **Stay in scope.** Touch only the files listed under "Files". You'll see other bugs — they belong to other agents; fixing them causes conflicts. 

3. **Match text exactly.** FIND means character-for-character. If you can't find it, STOP and report what you actually found. Don't guess. 

4. **Never edit an existing migration** — they've already run against the live DB. Only ADD new numbered files. 

5. **Migrations run by hand:** Supabase dashboard → SQL Editor → paste → Run. There is no CLI. 

6. **Verify with real output.** Run the Verify block and paste what you got. Never claim success without it. 

7. **Blocked? Say so.** "Couldn't do X because Y" beats a guess. 

 

## Codebase facts 

 

- **Project ID is hardcoded:** `10000000-0000-0000-0000-000000000000` = `DEFAULT_PROJECT_ID` in `src/lib/constants.ts`. Every query filters on it. 

- **Next.js 16 App Router.** Server Actions (`'use server'`) in `src/actions/`. 

- **Server Actions are public HTTP endpoints.** Each compiles to a POST endpoint callable with any arguments. The UI is not a security boundary. Critical for fixes 3 and 19. 

- **Two financial models exist mid-migration:** old `transactions` (single-entry) and new `vouchers` + `voucher_lines` (double-entry). **All new code uses vouchers.** 

- **`npm run lint` has ~120 pre-existing errors.** Not your problem — just don't add more. 

 

**After every change:** `npx tsc --noEmit` and `npx next build` must both pass. 

 

## Order 

 

| Phase | Fixes | Why | 

|---|---|---| 

| 1 | 1, 2 | App can't save anything; DB is publicly readable | 

| 2 | 3, 4, 5, 6 | Security holes + silently wrong balances | 

| 3 | 7–13 | Finish the double-entry migration | 

| 4 | 14, 15, 16 | Export/import/backup all fail | 

| 5 | 17–20 | UI, validation, cleanup | 

 

Migration numbers are pre-assigned so parallel agents don't collide: `006_seed_ledgers` (fix 1), `007_rls` (2), `008_balance_views` (5), `009_reverse_voucher` (10), `010_credit_method` (11), `011_module_spend` (13), `012_indexes` (19). 

 

--- 

 

# FIX 1 — Seed the chart of accounts 

 

**BLOCKER — nothing works until this is done.** Depends on: nothing. 

 

## Problem 

 

Migration `005` creates `ledger_accounts` but **no migration ever inserts rows.** Every save path calls `getLedgerId(name)` in `src/actions/accounting.ts`, which throws `Ledger account not found for name: ${name}` when the lookup fails. 

 

Empty table → throws every time → **no record can ever be saved.** It also empties every account dropdown, because `getAccounts()` reads the same table filtered to names `Cash` and `Bank`. 

 

## Files 

 

CREATE `shambala/supabase/migrations/006_seed_ledgers.sql` 

 

## The 12 required names 

 

Grepped from `getLedgerId('...')` across `src/actions/`. String-matched — capitalisation must be exact. 

 

| Name | Group | Normal balance | Used by | 

|---|---|---|---| 

| `Cash`, `Bank` | Asset | Debit | account dropdowns | 

| `Material Inventory` | Asset | Debit | materials.ts | 

| `Worker Payable` | Liability | Credit | labour, salary, machinery | 

| `Supplier Payable` | Liability | Credit | materials, machinery, transport | 

| `Owner Capital` | Equity | Credit | money.ts | 

| `Labour Expense` | Expense | Debit | labour.ts | 

| `Salary Expense` | Expense | Debit | salary.ts | 

| `Transport Expense` | Expense | Debit | materials, transport | 

| `Machine Fuel Expense` | Expense | Debit | machinery.ts | 

| `Machinery Expense` | Expense | Debit | *needed by fix 12* | 

| `Food Expense` | Expense | Debit | *needed by fix 8* | 

 

## Steps 

 

```sql 

-- 006_seed_ledgers.sql 

-- Required by src/actions/accounting.ts -> getLedgerId(). 

-- Names must match the string literals in src/actions/*.ts exactly. 

 

ALTER TABLE ledger_accounts 

  ADD CONSTRAINT uq_ledger_accounts_project_name UNIQUE (project_id, name); 

 

INSERT INTO ledger_accounts (project_id, name, account_group, normal_balance) VALUES 

  ('10000000-0000-0000-0000-000000000000', 'Cash',                 'Asset',     'Debit'), 

  ('10000000-0000-0000-0000-000000000000', 'Bank',                 'Asset',     'Debit'), 

  ('10000000-0000-0000-0000-000000000000', 'Material Inventory',   'Asset',     'Debit'), 

  ('10000000-0000-0000-0000-000000000000', 'Worker Payable',       'Liability', 'Credit'), 

  ('10000000-0000-0000-0000-000000000000', 'Supplier Payable',     'Liability', 'Credit'), 

  ('10000000-0000-0000-0000-000000000000', 'Owner Capital',        'Equity',    'Credit'), 

  ('10000000-0000-0000-0000-000000000000', 'Labour Expense',       'Expense',   'Debit'), 

  ('10000000-0000-0000-0000-000000000000', 'Salary Expense',       'Expense',   'Debit'), 

  ('10000000-0000-0000-0000-000000000000', 'Transport Expense',    'Expense',   'Debit'), 

  ('10000000-0000-0000-0000-000000000000', 'Machine Fuel Expense', 'Expense',   'Debit'), 

  ('10000000-0000-0000-0000-000000000000', 'Machinery Expense',    'Expense',   'Debit'), 

  ('10000000-0000-0000-0000-000000000000', 'Food Expense',         'Expense',   'Debit') 

ON CONFLICT (project_id, name) DO NOTHING; 

``` 

 

Run it in the SQL Editor. If you get `constraint ... already exists`, keep it in the file but paste only the `INSERT`. 

 

## Verify 

 

```sql 

SELECT COUNT(*) FROM ledger_accounts 

WHERE project_id = '10000000-0000-0000-0000-000000000000'; 

-- expected: 12 

``` 

 

Then `npm run dev` → `/labour/add` → "+ More Details" → the **Paid From Account** dropdown must now list `Cash` and `Bank`. It was empty before. 

 

## Do NOT 

 

- Don't edit `005` or any existing migration. 

- Don't rename a ledger — `"Cash Account"` or `"cash"` breaks the string match. 

- Don't touch the legacy `accounts` table (seeded in `002` with `Cash on Hand`/`IDBI Bank`). Different table, retired separately. 

- Don't add extra ledgers. 

 

--- 

 

# FIX 2 — Enable Row Level Security 

 

**CRITICAL SECURITY — do before any public deploy.** Depends on: fix 1. 

 

## Problem 

 

`src/lib/supabase/client.ts` ships `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the browser. That's normal — **the anon key is designed to be public.** It's safe *only* when RLS is enabled, because RLS is what actually enforces "you must be logged in". 

 

**This repo has zero RLS policies.** No `ENABLE ROW LEVEL SECURITY`, no `CREATE POLICY`, no `auth.uid()` in any of the five migrations. 

 

So anyone can open the site, read the key from the JS bundle, and: 

 

```js 

await supabase.from('salary_records').select('*')   // every wage 

await supabase.from('vouchers').delete().neq('id','00000000-0000-0000-0000-000000000000') 

``` 

 

`/login` hides the UI, not the data. 

 

## Files 

 

CREATE `shambala/supabase/migrations/007_rls.sql`. No app code changes. 

 

## Step 1 — Get the real table list 

 

```sql 

SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename; 

``` 

 

Expect 25 tables. **If your list differs, use yours** — the DB is the source of truth. Note any difference in your report. 

 

## Step 2 — The migration 

 

Single-tenant app; every logged-in user is trusted staff. Policy: authenticated = full access, anonymous = nothing. 

 

```sql 

-- 007_rls.sql 

-- The anon key ships in the browser bundle, so RLS is the ONLY thing 

-- preventing public read/write of all financial data. 

 

DO $$ 

DECLARE t TEXT; 

BEGIN 

  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 

  LOOP 

    -- RLS on with no policy = deny everything. Safe default. 

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t); 

    EXECUTE format('DROP POLICY IF EXISTS authenticated_full_access ON public.%I;', t); 

    EXECUTE format($f$ 

      CREATE POLICY authenticated_full_access ON public.%I 

        FOR ALL TO authenticated USING (true) WITH CHECK (true); 

    $f$, t); 

  END LOOP; 

END $$; 

 

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon; 

``` 

 

| Clause | Meaning | 

|---|---| 

| `ENABLE ROW LEVEL SECURITY` | RLS on. With no policies, **all access denied** — safe default | 

| `TO authenticated` | Only users with a valid login JWT. `anon` excluded, therefore blocked | 

| `USING (true)` / `WITH CHECK (true)` | Which rows are readable / writable | 

 

**Why not per-user scoping?** The app hardcodes one project and has no roles or membership table. Per-user policies would break it today. 

 

## Verify 

 

```sql 

SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'; 

-- expected: rowsecurity = true for ALL rows 

 

SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname='public'; 

-- expected: matches your table count 

``` 

 

**The important one** — run before and after to see the difference: 

 

```bash 

curl "https://YOUR-PROJECT.supabase.co/rest/v1/salary_records?select=*" \ 

  -H "apikey: YOUR_ANON_KEY" 

``` 

- **After:** `[]` or a permission error 

- **FAIL:** real salary rows → RLS isn't working, stop and investigate 

 

Then log in and confirm the home page, `/labour`, and saving a record all still work. If a page breaks, it's likely calling Supabase without a session — report which page and the error. **Do not disable RLS to make it pass.** 

 

## Do NOT 

 

- Don't use `TO public` or `USING (auth.role() = 'anon')`. 

- Don't put the `service_role` key in the app — it bypasses RLS and must never reach the browser or any `NEXT_PUBLIC_*` var. 

- Don't disable RLS on a table because a query broke. 

 

**Later (not now):** when multi-project support arrives, add a `project_members(user_id, project_id, role)` table and scope policies with `USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))`. 

 

--- 

 

# FIX 3 — `deleteRecord` accepts any table name 

 

**CRITICAL SECURITY.** Depends on: nothing (compatible with fix 4). 

 

## Problem 

 

`src/actions/transactions.ts`: 

 

```ts 

export async function deleteRecord(tableName: string, id: string) { 

  const { error } = await supabase.from(tableName).delete().eq('id', id); 

``` 

 

`tableName` is a raw string from the caller, passed straight into `.from()`. Since Server Actions are public endpoints: 

 

```js 

deleteRecord('projects', '10000000-0000-0000-0000-000000000000') 

``` 

 

`001_schema.sql` declares `ON DELETE CASCADE` from nearly every table to `projects`. **That one call wipes the database.** There's also no `project_id` filter, so any row in any project can be deleted. 

 

> **RLS doesn't help here.** Fix 2 blocks anonymous callers; this runs with the logged-in user's session. Both fixes are needed. 

 

## Files 

 

EDIT `shambala/src/actions/transactions.ts` 

 

## Step 1 — Allowlist 

 

INSERT above `export async function deleteRecord`: 

 

```ts 

/** 

 * Tables a user may delete from. Server Actions are public HTTP endpoints, 

 * so the table name MUST be validated — never passed through from the caller. 

 * Excluded: projects, ledger_accounts, vouchers, voucher_lines, parties, masters. 

 */ 

const DELETABLE_TABLES = [ 

  'labour_records', 'food_records', 'machinery_records', 'salary_records', 

  'material_deliveries', 'transport_trips', 'fuel_records', 'transactions', 

] as const; 

 

export type DeletableTable = (typeof DELETABLE_TABLES)[number]; 

 

function assertDeletable(tableName: string): asserts tableName is DeletableTable { 

  if (!(DELETABLE_TABLES as readonly string[]).includes(tableName)) { 

    throw new Error(`Refusing to delete from non-allowlisted table: ${tableName}`); 

  } 

} 

``` 

 

These eight are exactly what the UI's delete buttons target — confirm with `grep -rn "deleteRecord(" shambala/src/app/`. 

 

## Step 2 — Signature + guard 

 

FIND: 

```ts 

export async function deleteRecord(tableName: string, id: string) { 

  const supabase = await createClient(); 

``` 

REPLACE: 

```ts 

export async function deleteRecord(tableName: DeletableTable, id: string) { 

  assertDeletable(tableName); 

 

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { 

    throw new Error('Invalid record id'); 

  } 

 

  const supabase = await createClient(); 

``` 

 

**Both checks are required.** The type only helps your own code at compile time; a malicious request carries no types. `assertDeletable` is what actually protects you. 

 

## Step 3 — Scope to project 

 

FIND: 

```ts 

  const { error } = await supabase.from(tableName).delete().eq('id', id); 

``` 

REPLACE: 

```ts 

  const { error } = await supabase 

    .from(tableName) 

    .delete() 

    .eq('id', id) 

    .eq('project_id', DEFAULT_PROJECT_ID); 

``` 

 

All eight allowlisted tables have `project_id`. (`transactions` returns early at the top and never reaches this line — leave that block alone.) `DEFAULT_PROJECT_ID` is already imported. 

 

## Step 4 — Call sites 

 

```bash 

npx tsc --noEmit 

``` 

 

If you see `Argument of type '"transport_records"' is not assignable` — fix 4 hasn't been done. **Don't add `transport_records` to the allowlist.** Do fix 4 first or report blocked. 

 

## Verify 

 

```bash 

cd shambala 

grep -n "assertDeletable" src/actions/transactions.ts        # 2 lines 

grep -n "export async function deleteRecord" src/actions/transactions.ts 

# must read (tableName: DeletableTable, ...) NOT (tableName: string, ...) 

npx tsc --noEmit && npx next build 

``` 

 

Temporarily run `await deleteRecord('projects' as any, '10000000-0000-0000-0000-000000000000');` — it must throw, and the project must still exist. Remove the test. Then confirm a normal delete from `/labour` still works. 

 

## Do NOT 

 

- Don't add `projects`, `ledger_accounts`, `vouchers`, `parties`, or any master table to the allowlist. 

- Don't drop the runtime check and rely on TypeScript — types vanish at runtime. 

- Don't rewrite the rest of `deleteRecord`; the orphaned-voucher problem is **fix 10**. 

 

--- 

 

# FIX 4 — Transport page reads a dead table 

 

**HIGH** — the page is permanently empty and its delete silently lies. Depends on: nothing. 

 

## Problem 

 

Migration `004` replaced `transport_records` with `transport_trips`. Writes were migrated (`actions/transport.ts`, `actions/materials.ts`); **reads were not.** 

 

1. **The list is always empty** — trips go to `transport_trips`, the page reads `transport_records`. 

2. **Delete silently does nothing.** `DELETE FROM transport_records WHERE id=...` matches 0 rows, Postgres returns success, the UI reports success, the record stays. Worse than an error. 

 

The new table has its **own `project_id` and `date`**, and `delivery_id` is now optional — `createStandaloneTransportRecord` creates trips with no delivery, so `delivery?.date` would stamp today's date on all of them. 

## Files 

 

EDIT `shambala/src/app/transport/page.tsx` 

 

## Steps 

 

**1.** FIND: 

```tsx 

  const { data, error } = await supabase 

    .from('transport_records') 

    .select(` 

      *, 

      vehicle:transport_vehicles(vehicle_number, vehicle_type),

      delivery:material_deliveries(date, material:materials(name)) 

    `) 

    .order('created_at', { ascending: false }) 

    .limit(limit); 

``` 

REPLACE: 

```tsx 

  const { data, error } = await supabase 

    .from('transport_trips') 

    .select(` 

      *, 

      vehicle:transport_vehicles(vehicle_number, vehicle_type), 

      delivery:material_deliveries(date, material:materials(name)) 

    `) 

    .eq('project_id', DEFAULT_PROJECT_ID) 

    .order('date', { ascending: false }) 

    .order('created_at', { ascending: false }) 

    .limit(limit); 

``` 

 

**2.** FIND `const date = delivery?.date || new Date().toLocaleDateString('en-CA');` 

REPLACE `const date = r.date || delivery?.date || new Date().toLocaleDateString('en-CA');` 

 

**3.** FIND `await deleteRecord('transport_records', r.id);` → `'transport_trips'` 

 

**4.** Confirm `import { DEFAULT_PROJECT_ID } from '@/lib/constants';` exists at the top; add if missing. 

 

## Verify 

 

```bash 

cd shambala 

grep -n "transport_records" src/app/transport/page.tsx   # NO OUTPUT 

npx tsc --noEmit && npx next build 

``` 

 

`npm run dev` → `/transport/add` create a record → `/transport` **it must now appear** (was always empty) → delete it → **it must actually disappear** after refresh. 

 

## Do NOT 

 

- Don't modify `src/actions/transport.ts` — its writes are correct. 

- Don't drop the `transport_records` table; `material_deliveries` still has an FK to consider. 

- Don't migrate old rows. If the old table holds real data, report it — that's the owner's call. 

- Don't change `deleteRecord` itself (fix 3) — only the argument passed to it. 

 

--- 

 

# FIX 5 — Balances silently truncate at 1,000 rows 

 

**HIGH** — the cash balance quietly becomes wrong. Depends on: fix 1. 

 

## Problem 

 

`src/actions/accounts.ts` fetches raw rows and sums them in JavaScript: 

 

```ts 

const { data: lines } = await supabase 

  .from('voucher_lines') 

  .select('ledger_id, debit, credit') 

  .in('ledger_id', ledgerIds);          // RAW ROWS — then summed in a JS loop 

``` 

 

**PostgREST caps every response at 1,000 rows.** Past that, the balance is computed from a partial dataset — with **no error and no warning**, and it worsens daily. A site posting ~20 labour entries/day (2 lines each) crosses 1,000 lines in about **25 days**. In an accounting app, a silently wrong balance destroys all trust. 

 

Same flaw in `getThisMonthSpent()` and all six queries in `reports.ts` (fix 13). 

 

**Principle: never transfer rows in order to sum them. Aggregate in Postgres.** 

 

## Files 

 

CREATE `shambala/supabase/migrations/008_balance_views.sql` · EDIT `shambala/src/actions/accounts.ts` 

 

## Step 1 — Views 

 

```sql 

-- 008_balance_views.sql 

-- Aggregate in Postgres. Never ship raw voucher_lines to the client and sum 

-- in JS — PostgREST caps responses at 1000 rows, silently truncating balances. 

 

CREATE OR REPLACE VIEW ledger_balances AS 

SELECT 

  la.id AS ledger_id, la.project_id, la.name, la.account_group, la.normal_balance, 

  COALESCE(SUM( 

    CASE WHEN la.normal_balance = 'Debit' 

         THEN vl.debit - vl.credit ELSE vl.credit - vl.debit END 

  ), 0)::NUMERIC(15,2) AS balance 

FROM ledger_accounts la 

LEFT JOIN voucher_lines vl ON vl.ledger_id = la.id 

LEFT JOIN vouchers v ON v.id = vl.voucher_id 

                    AND v.project_id = la.project_id 

                    AND v.is_reversed = FALSE 

GROUP BY la.id, la.project_id, la.name, la.account_group, la.normal_balance; 

 

CREATE OR REPLACE VIEW monthly_expense_totals AS 

SELECT v.project_id, DATE_TRUNC('month', v.date)::DATE AS month, 

       COALESCE(SUM(vl.debit - vl.credit), 0)::NUMERIC(15,2) AS total 

FROM vouchers v 

JOIN voucher_lines vl ON vl.voucher_id = v.id 

JOIN ledger_accounts la ON la.id = vl.ledger_id 

WHERE la.account_group = 'Expense' AND v.is_reversed = FALSE 

GROUP BY v.project_id, DATE_TRUNC('month', v.date); 

 

GRANT SELECT ON ledger_balances TO authenticated; 

GRANT SELECT ON monthly_expense_totals TO authenticated; 

``` 

 

`LEFT JOIN` keeps zero-balance ledgers visible. `is_reversed = FALSE` excludes reversals (fix 10). The join to `vouchers` supplies `project_id` — `voucher_lines` has no such column. 

 

## Step 2 — Replace both functions 

 

Replace the whole of `getAccountBalances`: 

 

```ts 

export async function getAccountBalances(): Promise<AccountBalance[]> { 

  const supabase = await createClient(); 

 

  // Aggregated in Postgres — see migration 008. Do not fetch raw voucher_lines 

  // and sum in JS; PostgREST truncates at 1000 rows. 

  const { data, error } = await supabase 

    .from('ledger_balances') 

    .select('ledger_id, name, balance') 

    .eq('project_id', DEFAULT_PROJECT_ID) 

    .in('name', ['Cash', 'Bank']) 

    .order('name'); 

 

  if (error) throw new Error(error.message); 

 

  return (data || []).map(l => ({ 

    account_id: l.ledger_id, 

    account_name: l.name, 

    account_type: l.name.toLowerCase(), 

    balance: Number(l.balance) || 0, 

  })); 

} 

``` 

 

And the whole of `getThisMonthSpent`: 

 

```ts 

export async function getThisMonthSpent(): Promise<number> {a 

  const supabase = await createClient(); 

  const now = new Date(); 

  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`; 

 

  const { data, error } = await supabase 

    .from('monthly_expense_totals') 

    .select('total') 

    .eq('project_id', DEFAULT_PROJECT_ID) 

    .eq('month', firstDay) 

    .maybeSingle(); 

 

  if (error) throw new Error(error.message); 

  return Number(data?.total) || 0; 

} 

``` 

 

**`maybeSingle()` not `single()`** — `single()` throws on zero rows, and a month with no expenses legitimately has none. The home page must show ₹0, not crash. 

 

If fix 6 is done, views won't be in `database.types.ts` until regenerated. Regenerate, or add a marked `(supabase as any)` cast with a comment. 

 

## Verify 

 

```sql 

SELECT name, balance FROM ledger_balances 

WHERE project_id='10000000-0000-0000-0000-000000000000' ORDER BY name; 

-- expected: exactly 12 rows, no duplicates 

``` 

 

Cross-check Cash against a manual sum over `voucher_lines` joined to `vouchers` and `ledger_accounts` (same filters as the view) — the two must match. 

 

**Prove the 1,000-row fix.** If `SELECT COUNT(*) FROM voucher_lines` is under 1,000, generate data: 

 

```sql 

DO $$ 

DECLARE i INT; cash UUID; exp UUID; 

BEGIN 

  SELECT id INTO cash FROM ledger_accounts WHERE name='Cash' 

    AND project_id='10000000-0000-0000-0000-000000000000'; 

  SELECT id INTO exp FROM ledger_accounts WHERE name='Labour Expense' 

    AND project_id='10000000-0000-0000-0000-000000000000'; 

  FOR i IN 1..600 LOOP 

    PERFORM post_voucher('10000000-0000-0000-0000-000000000000', 

      'LOADTEST-'||i, 'Journal', CURRENT_DATE, 'load test', NULL, NULL, 

      jsonb_build_array( 

        jsonb_build_object('ledger_id', exp,  'debit', 1), 

        jsonb_build_object('ledger_id', cash, 'credit', 1))); 

  END LOOP; 

END $$; 

``` 

 

Reload the home page — **cash must have moved by exactly −600.** Less means aggregation is still client-side. Clean up: `DELETE FROM vouchers WHERE voucher_no LIKE 'LOADTEST-%';` 

 

```bash 

grep -n "from('voucher_lines')" src/actions/accounts.ts   # NO OUTPUT 

npx tsc --noEmit && npx next build 

``` 

 

## Do NOT 

 

- Don't "fix" this with `.limit(100000)` or JS pagination — slow and still breaks. 

- Don't change the `AccountBalance` shape; `src/app/page.tsx` needs `account_type` to be `'cash'`/`'bank'`. 

- Don't touch `getAccounts()` (max 2 rows) or `reports.ts` (**fix 13**). 

 

--- 

 

# FIX 6 — Type the Supabase client 

 

**HIGH — highest value per line changed.** Depends on: nothing. 

 

## Problem 

 

`src/lib/database.types.ts` (1,725 generated lines) describes every table and column. **It is never imported:** 

 

```bash 

grep -rn "database.types" shambala/src/ --include=*.ts --include=*.tsx   # NO OUTPUT 

``` 

 

So `supabase.from('anything')` returns `any` and TypeScript can't catch bad table names, columns, or enum values. **This is exactly why three bugs shipped:** `/api/export` selects a `categories` table that doesn't exist and a `deleted_at` column that doesn't exist; `/api/import` inserts `parties.type` when the column is `class`. 

 

## Files 

 

EDIT the three files in `shambala/src/lib/supabase/`. Marked casts elsewhere only if needed. 

 

## Steps 

 

**1.** Sanity-check: `grep -c "Row:" src/lib/database.types.ts` should be 25+. If empty or malformed, regenerate and say so. 

 

**2.** `server.ts` — add `import type { Database } from '@/lib/database.types';` and change `createServerClient(` → `createServerClient<Database>(` 

 

**3.** `client.ts` — same, with `createBrowserClient<Database>(` 

 

**4.** `middleware.ts` — same, `createServerClient<Database>(` 

 

## Step 5 — Handle the errors this surfaces 

 

```bash 

npx tsc --noEmit 

``` 

 

**You will get errors. That's the point.** Sort them: 

 

- **A — table/column genuinely missing.** A real bug (fixes 14/15/16). **Don't silence it** — record file+line in your report. To keep the build green without hiding it, add `(supabase as any)` with a mandatory `// BUG: table does not exist — see fix 14` comment so the next agent finds it. 

- **B — join typed `T[]` vs `T`.** Existing code already uses `as any`; leave it. For a new one: `const w = Array.isArray(r.worker) ? r.worker[0] : r.worker;` 

- **C — insert missing a required column.** Real bug. Add it if obvious (`project_id: DEFAULT_PROJECT_ID`), else report. 

- **D — `ledger_accounts`/`vouchers` unknown.** The types file predates migration `005`. **Regenerate** rather than cast. 

 

## Step 6 — Report what you found 

 

The most valuable output of this fix: 

 

| File | Line | Error | Cat | 

|---|---|---|---| 

| `api/export/route.ts` | 20 | `categories` table doesn't exist | A | 

| `api/export/route.ts` | 25 | `deleted_at` column doesn't exist | A | 

| `api/import/route.ts` | 50 | `parties.type` should be `class` | A | 

 

## Verify 

 

```bash 

cd shambala 

grep -rn "createServerClient<Database>\|createBrowserClient<Database>" src/lib/supabase/  # 3 lines 

npx tsc --noEmit && npx next build 

``` 

 

Prove it works: add `await supabase.from('this_does_not_exist').select('*');` temporarily — it must error. Delete it. 

 

## Do NOT 

 

- Don't invent missing tables/columns to silence Category A. 

- Don't blanket-cast (`createServerClient<any>`) — that undoes the fix. 

- Don't add `@ts-nocheck` / `@ts-ignore`. 

- Don't hand-edit `database.types.ts`; regenerate it. 

- Don't try to fix the 111 pre-existing `no-explicit-any` lint errors. 

 

--- 

 

# FIX 7 — Context: the split-brain problem 

 

**Not a task.** Read this before doing fixes 8–13. 

 

The app is **halfway through a migration** from single-entry to double-entry. Both systems exist and different features read different ones: 

 

| Code | Reads/writes | Status | 

|---|---|---| 

| `labour`, `salary`, `machinery`, `materials`, `transport`, `money` | `vouchers` | ✅ | 

| `food.ts` | `transactions` | ❌ fix 8 | 

| `getDayBook()`, `getPartyTransactions()` | `transactions` | ❌ fix 9 | 

| `deleteRecord()` | `transactions` | ❌ fix 10 | 

| `/api/export`, `/api/backup` | `transactions` | ❌ fixes 14, 16 | 

 

**Rule: all new code uses `vouchers` + `voucher_lines`. Never write to `transactions`.** 

 

## The correct pattern 

 

Every expense accrues the liability, then settles it if paid. From `labour.ts`: 

 

```ts 

// 1. ACCRUAL — the cost happened and we owe someone 

await postVoucher({ 

  voucher_no: `JV-LAB-${Date.now()}`, 

  type: 'Journal', 

  date: data.date, 

  reference_table: 'labour_records', 

  reference_id: record.id, 

  lines: [ 

    { ledger_id: labourExpenseLedgerId, debit: data.amount, cost_center_id: data.building_id }, 

    { ledger_id: workerPayableLedgerId, credit: data.amount, party_id: data.worker_id }, 

  ], 

}); 

 

// 2. PAYMENT — only if actually paid now 

if (data.account_id) { 

  await postVoucher({ 

    voucher_no: `PV-LAB-${Date.now()}`, 

    type: 'Payment', 

    date: data.date, 

    reference_table: 'labour_records', 

    reference_id: record.id, 

    lines: [ 

      { ledger_id: workerPayableLedgerId, debit: data.amount, party_id: data.worker_id }, 

      { ledger_id: data.account_id, credit: data.amount }, 

    ], 

  }); 

} 

``` 

 

Paid: Expense +X, Payable 0, Cash −X. Unpaid: Expense +X, Payable +X, Cash unchanged. 

 

## Non-negotiable rules 

 

- **Debits must equal credits** — `post_voucher()` raises an exception otherwise. 

- **Always set both `reference_table` and `reference_id`** so vouchers can be traced and reversed. 

- **Always set `party_id` on payable lines** — otherwise you know *that* you owe, not *whom*. 

- **Set `cost_center_id`** to the building where applicable, for per-building cost reports. 

 

--- 

 

# FIX 8 — Food never reaches the ledger 

 

**HIGH** — cash balance is overstated by every food purchase. Depends on: fix 1. 

 

## Problem 

 

Every other module posts vouchers; **`food.ts` was missed.** Line 27 of `src/actions/food.ts` still writes to the legacy table, so **food spending never reduces cash** and is missing from "spent this month". 

 

## Files 

 

EDIT `shambala/src/actions/food.ts` 

 

## Steps 

 

**1.** After `import { revalidatePath } from 'next/cache';` add: 

```ts 

import { postVoucher, getLedgerId } from './accounting'; 

``` 

 

**2.** FIND the whole block starting `// If there is an amount, we optionally create a transaction if it was paid immediately.` through its closing `}` (lines 27–40) and REPLACE with: 

 

```ts 

  // Double-entry: accrue against the shop's payable, then clear it from 

  // cash/bank if paid immediately. Mirrors labour.ts. 

  if (data.amount && data.amount > 0) { 

    const foodExpenseLedgerId = await getLedgerId('Food Expense'); 

    const supplierPayableLedgerId = await getLedgerId('Supplier Payable'); 

 

    await postVoucher({ 

      voucher_no: `JV-FOOD-${Date.now()}`, 

      type: 'Journal', 

      date: data.start_date || new Date().toISOString().split('T')[0], 

      narration: `Food & groceries for ${data.start_date}`, 

      reference_table: 'food_records', 

      reference_id: record.id, 

      lines: [ 

        { ledger_id: foodExpenseLedgerId, debit: data.amount }, 

        { ledger_id: supplierPayableLedgerId, credit: data.amount, party_id: data.shop_id || null }, 

      ], 

    }); 

 

    if (data.account_id) { 

      await postVoucher({ 

        voucher_no: `PV-FOOD-${Date.now()}`, 

        type: 'Payment', 

        date: data.start_date || new Date().toISOString().split('T')[0], 

        narration: `Payment for food on ${data.start_date}`, 

        reference_table: 'food_records', 

        reference_id: record.id, 

        lines: [ 

          { ledger_id: supplierPayableLedgerId, debit: data.amount, party_id: data.shop_id || null }, 

          { ledger_id: data.account_id, credit: data.amount }, 

        ], 

      }); 

    } 

  } 

``` 

 

**No `cost_center_id`** — food feeds the whole site and `food_records` has no `building_id` column. 

 

## Verify 

 

```bash 

cd shambala 

grep -n "from('transactions')" src/actions/food.ts   # NO OUTPUT 

npx tsc --noEmit && npx next build 

``` 

 

Note the cash balance → `/food/add` create a **₹500** record with account = Cash → reload home. **Cash must drop exactly ₹500 and "spent this month" rise ₹500.** Before this fix neither moved. 

 

```sql 

SELECT v.voucher_no, la.name, vl.debit, vl.credit 

FROM vouchers v JOIN voucher_lines vl ON vl.voucher_id = v.id 

JOIN ledger_accounts la ON la.id = vl.ledger_id 

WHERE v.reference_table='food_records' ORDER BY v.created_at DESC LIMIT 4; 

-- expected: Food Expense 500/0, Supplier Payable 0/500, Supplier Payable 500/0, Cash 0/500 

``` 

 

## Do NOT 

 

- Don't keep the old insert "for safety" — that double-counts. 

- Don't invent a `Food Payable` ledger; a food shop is a supplier. 

- Don't migrate historical rows here. Report the count instead: 

  `SELECT COUNT(*) FROM transactions WHERE reference_table='food_records';` 

 

--- 

 

# FIX 9 — Day Book and party ledger are always blank 

 

**HIGH.** Depends on: fix 1. 

 

## Problem 

 

`getDayBook` (in `reports.ts`) and `getPartyTransactions` (in `parties.ts`) both query `transactions`, which after fix 8 nothing writes to. So the Day Book tab is always empty and **every worker's ledger page shows nothing** regardless of what you've paid them. 

 

## Files 

 

EDIT `src/actions/reports.ts` (`getDayBook` only) · `src/actions/parties.ts` (`getPartyTransactions` only) · `src/app/more/people/[id]/page.tsx` 

 

## Step 1 — `getDayBook` 

 

Replace the whole function: 

 

```ts 

export async function getDayBook(date: string) { 

  const supabase = await createClient(); 

 

  // Reads the double-entry ledger; `transactions` is no longer written to. 

  const { data, error } = await supabase 

    .from('vouchers') 

    .select(` 

      id, voucher_no, type, date, narration, created_at, 

      lines:voucher_lines( 

        debit, credit, 

        ledger:ledger_accounts(name, account_group), 

        party:parties(name) 

      ) 

    `) 

    .eq('project_id', DEFAULT_PROJECT_ID) 

    .eq('date', date) 

    .eq('is_reversed', false) 

    .order('created_at', { ascending: true }); 

 

  if (error) throw new Error(error.message); 

  return data || []; 

} 

``` 

 

## Step 2 — `getPartyTransactions` 

 

A party's ledger is every voucher line carrying their `party_id`. Replace the whole function: 

 

```ts 

export interface PartyLedgerLine { 

  id: string; date: string; voucher_no: string; voucher_type: string; 

  narration: string | null; ledger_name: string; debit: number; credit: number; 

} 

 

export async function getPartyTransactions( 

  partyId: string, dateFrom?: string, dateTo?: string 

): Promise<PartyLedgerLine[]> { 

  const supabase = await createClient(); 

 

  let query = supabase 

    .from('voucher_lines') 

    .select(` 

      id, debit, credit, 

      ledger:ledger_accounts!inner(name), 

      voucher:vouchers!inner(voucher_no, type, date, narration, project_id, is_reversed) 

    `) 

    .eq('party_id', partyId) 

    .eq('voucher.project_id', DEFAULT_PROJECT_ID) 

    .eq('voucher.is_reversed', false); 

 

  if (dateFrom) query = query.gte('voucher.date', dateFrom); 

  if (dateTo) query = query.lte('voucher.date', dateTo); 

 

  const { data, error } = await query; 

  if (error) throw new Error(error.message); 

 

  const first = <T,>(v: T | T[] | null): T | null => Array.isArray(v) ? (v[0] ?? null) : v; 

 

  const rows: PartyLedgerLine[] = (data || []).map((r: any) => { 

    const voucher = first(r.voucher); 

    const ledger = first(r.ledger); 

    return { 

      id: r.id, 

      date: voucher?.date ?? '', 

      voucher_no: voucher?.voucher_no ?? '', 

      voucher_type: voucher?.type ?? '', 

      narration: voucher?.narration ?? null, 

      ledger_name: ledger?.name ?? '', 

      debit: Number(r.debit) || 0, 

      credit: Number(r.credit) || 0, 

    }; 

  }); 

 

  // Sort in JS — PostgREST cannot order by a joined column. 

  rows.sort((a, b) => a.date.localeCompare(b.date)); 

  return rows; 

} 

``` 

 

`!inner` makes it an INNER JOIN, required for the `.eq('voucher.project_id', ...)` filter to work. 

 

## Step 3 — The party page 

 

The page maps legacy transaction types via a `TXN_TYPE_MAP` constant. Obsolete — the new data has real debit/credit. Replace the `ledgerRows` `useMemo` with: 

 

```ts 
  const { ledgerRows, totalDebit, totalCredit, closingBalance } = useMemo(() => { 

    let running = 0, debitSum = 0, creditSum = 0; 

 

    const rows = transactions.map((line: any) => { 

      const debit = Number(line.debit) || 0; 

      const credit = Number(line.credit) || 0; 

 

      // Party view: a credit increases what we owe them, a debit reduces it. 

      running += credit - debit; 

      debitSum += debit; 

      creditSum += credit; 

 

      return { 

        id: line.id, 

        date: line.date, 

        particulars: line.narration || line.ledger_name || line.voucher_no, 

        voucherType: line.voucher_type, 

        accountName: line.ledger_name, 

        refTable: line.voucher_no, 

        debit, credit, balance: running, 

      }; 

    }); 

 

    return { ledgerRows: rows, totalDebit: debitSum, totalCredit: creditSum, closingBalance: running }; 

  }, [transactions]); 

``` 

 

Then **delete** the unused `TXN_TYPE_MAP` constant (~lines 11–18). This also clears an ESLint `react-hooks/immutability` error. 

 

Positive closing balance = "we still owe them". 

 

## Verify 

 

```bash
cd shambala 

grep -n "from('transactions')" src/actions/reports.ts src/actions/parties.ts  # NO OUTPUT 

npx tsc --noEmit && npx next build 

``` 

 

Save a ₹1000 labour record paid from Cash → `/more/people` → open that worker. **Expected:** two lines (₹1000 credit accrual, ₹1000 debit payment), closing balance ₹0. Was blank. Then `/reports` → Day Book → today's vouchers listed. 

 

## Do NOT 

 

- Don't drop the `transactions` table here. 

- Don't change `getMonthlyReport`/`getBuildingReport` (**fix 13**). 

- If the Day Book UI can't render the nested `lines` shape, adjust only the rendering in `src/app/reports/page.tsx` and say so — don't revert the query. 

 

--- 

 

# FIX 10 — Deletes leave orphaned ledger entries 

 

**HIGH.** Depends on: fixes 1, 3. 

 

## Problem 

 

`deleteRecord` cleans up the **legacy** table only. Nothing touches vouchers. Delete a ₹50,000 material delivery and: the record goes, its vouchers **remain**, the cash balance still reflects the ₹50,000, and nothing explains why. 

 

**Reverse, don't delete.** Deleting vouchers destroys the audit trail. The schema already has `is_reversed` and `reversed_by_id` — both never set. 

 

## Files 

 

CREATE `supabase/migrations/009_reverse_voucher.sql` · EDIT `src/actions/accounting.ts`, `src/actions/transactions.ts` 

 

## Step 1 — Reversal function 

 

```sql 

-- 009_reverse_voucher.sql 

-- Never delete a voucher. Post an equal-and-opposite one and flag the 

-- original, so the audit trail survives. 

 

CREATE OR REPLACE FUNCTION reverse_vouchers_for_reference( 

  p_project_id UUID, p_reference_table TEXT, p_reference_id UUID 

) RETURNS INT 

LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp 

AS $$ 

DECLARE v_original RECORD; v_new_id UUID; v_count INT := 0; 

BEGIN 

  FOR v_original IN 

    SELECT * FROM vouchers 

    WHERE project_id = p_project_id 

      AND reference_table = p_reference_table 

      AND reference_id = p_reference_id 

      AND is_reversed = FALSE 

  LOOP 

    INSERT INTO vouchers (project_id, voucher_no, type, date, narration, 

                          reference_table, reference_id) 

    VALUES (v_original.project_id, 'REV-' || v_original.voucher_no, v_original.type, 

            CURRENT_DATE, 

            'Reversal of ' || v_original.voucher_no || COALESCE(' - ' || v_original.narration, ''), 

            v_original.reference_table, v_original.reference_id) 

    RETURNING id INTO v_new_id; 

 

    -- Lines with debit and credit swapped 

    INSERT INTO voucher_lines (voucher_id, ledger_id, party_id, cost_center_id, 

                               debit, credit, due_date) 

    SELECT v_new_id, ledger_id, party_id, cost_center_id, credit, debit, due_date 

    FROM voucher_lines WHERE voucher_id = v_original.id; 

 

    -- Flag both so neither is reversed twice 

    UPDATE vouchers SET is_reversed = TRUE, reversed_by_id = v_new_id WHERE id = v_original.id; 

    UPDATE vouchers SET is_reversed = TRUE WHERE id = v_new_id; 

 

    v_count := v_count + 1; 

  END LOOP; 

 

  RETURN v_count; 

END; 

$$; 

 

REVOKE ALL ON FUNCTION reverse_vouchers_for_reference(UUID, TEXT, UUID) FROM PUBLIC, anon; 

GRANT EXECUTE ON FUNCTION reverse_vouchers_for_reference(UUID, TEXT, UUID) TO authenticated; 

``` 

 

Flagging the reversal too keeps both out of `ledger_balances` (which filters `is_reversed = FALSE`) while leaving both rows on record. 

 

## Step 2 — Server wrapper 

 

Append to `src/actions/accounting.ts`: 

 

```ts 

/** 

 * Reverses every non-reversed voucher linked to an operational record. 

 * Posts equal-and-opposite vouchers rather than deleting, preserving the audit trail. 

 */ 

export async function reverseVouchersForReference( 

  referenceTable: string, referenceId: string 

): Promise<number> { 

  const supabase = await createClient(); 

 

  const { data, error } = await supabase.rpc('reverse_vouchers_for_reference', { 

    p_project_id: DEFAULT_PROJECT_ID, 

    p_reference_table: referenceTable, 

    p_reference_id: referenceId, 

  }); 

 

  if (error) { 

    console.error('Failed to reverse vouchers:', error); 

    throw new Error(`Failed to reverse accounting entries: ${error.message}`); 

  } 

  return Number(data) || 0; 

} 

``` 

 

## Step 3 — Call before deleting 

 

In `src/actions/transactions.ts` add `import { reverseVouchersForReference } from './accounting';`, then INSERT immediately **above** the `// Delete the operational record` comment: 

 

```ts 

  // Reverse ledger entries BEFORE removing the record. If this throws, the 

  // operational row survives and the ledger stays consistent — far better 

  // than deleting the record and orphaning its vouchers. 

  await reverseVouchersForReference(tableName, id); 

``` 

 

**Order matters.** Delete-then-reverse leaves an untraceable orphan if the reversal fails. 

 

Also inside the `material_deliveries` block, add `await reverseVouchersForReference('transport_trips', tr.id);` as the first line of the transport loop, and the equivalent with `'weighbridge_records'` and `wb.id` in the weighbridge loop. 

 

## Verify 

 

Create a ₹1000 labour record paid from Cash, note the cash balance, confirm 4 voucher lines exist, then delete it from `/labour`. 

 

```sql 

SELECT v.voucher_no, la.name, vl.debit, vl.credit 

FROM vouchers v JOIN voucher_lines vl ON vl.voucher_id = v.id 

JOIN ledger_accounts la ON la.id = vl.ledger_id 

WHERE v.reference_table='labour_records' ORDER BY v.created_at DESC LIMIT 8; 

-- expected: original 4 lines PLUS 4 REV-* lines with debit/credit swapped 

``` 

 

**Cash must return to its original value.** Originals must show `is_reversed = true` with `reversed_by_id` populated and **no rows missing**. Calling the function twice must return `0`. 

 

## Do NOT 

 

- Don't `DELETE FROM vouchers`. Reversal only. 

- Don't reverse after deleting. 

- Don't remove the legacy `transactions` cleanup lines yet. 

- Don't change the fix-3 allowlist. 

 

--- 

 

# FIX 11 — Payables always net to zero 

 

**HIGH — defeats the entire double-entry engine.** Depends on: fix 1. 

 

## Problem 

 

`src/actions/labour.ts` line 59: 

```ts 

    if (data.payment_method !== ('credit' as any) && data.account_id) { 

``` 

 

**Two reasons this is always true.** 

 

1. **`'credit'` isn't in the enum.** `001_schema.sql` defines `payment_method AS ENUM ('cash','bank_transfer','upi','other')`. That's exactly why the author wrote `as any` — to silence the type error. The comparison can never match. 

2. **Forms always pre-fill an account.** All six `*Form.tsx` files do `useState(accounts.find(a => a.is_default)?.id || accounts[0].id)`. 

 

So the payment voucher always posts and **`Worker Payable`/`Supplier Payable` always net to zero.** You cannot record "hired 10 workers today, paying Friday" — the commonest case on a site. 

 

## Files 

 

CREATE `supabase/migrations/010_credit_method.sql` · EDIT `src/lib/constants.ts`, `src/actions/{labour,salary,machinery,materials,food}.ts`, and the six `*Form.tsx` files 

 

## Step 1 — The enum value 

 

```sql 

-- 010_credit_method.sql 

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'credit'; 

``` 

 

> **Run this statement ON ITS OWN.** `ALTER TYPE ... ADD VALUE` can't run inside a transaction block on older Postgres. Do it **before** editing any TypeScript. 

 

## Step 2 — UI label 

 

In `src/lib/constants.ts`, add to `PAYMENT_METHOD_LABELS`: 

```ts 

  credit: 'Credit (pay later)', 

``` 

Every form renders this map with `Object.entries(...)`, so it appears everywhere automatically. 

 

## Step 3 — Fix the conditions 

 

| File | FIND | REPLACE | 

|---|---|---| 

| `labour.ts`, `salary.ts` | `if (data.payment_method !== ('credit' as any) && data.account_id) {` | `if (data.payment_method !== 'credit' && data.account_id) {` | 

| `machinery.ts` (no check at all) | `if (data.account_id) {` | `if (data.payment_method !== 'credit' && data.account_id) {` | 

| `machinery.ts` fuel | `if (fuelAccountId) {` | `if (data.payment_method !== 'credit' && fuelAccountId) {` | 

| `materials.ts` | `if (account_id) {` | `if (account_id && delivery.payment_method !== 'credit') {` | 

| `food.ts` (if fix 8 done) | `if (data.account_id) {` | `if (data.payment_method !== 'credit' && data.account_id) {` | 

 

## Step 4 — Stop forms forcing an account 

 

In `LabourForm.tsx` (line 43), `SalaryForm.tsx` (35), `MachineryForm.tsx` (39), `MaterialsForm.tsx` (56), `FoodForm.tsx` (34), `TransportForm.tsx` (34): 

 

FIND `const [accountId, setAccountId] = useState(accounts.length > 0 ? (accounts.find((a: any) => a.is_default)?.id || accounts[0].id) : '');` 

REPLACE `const [accountId, setAccountId] = useState('');` 

 

Add below the state declarations: 

```tsx 

  // Default to the primary account, but clear it on credit so the cost 

  // accrues to a payable instead of being marked paid. 

  useEffect(() => { 

    if (paymentMethod === 'credit') { 

      setAccountId(''); 

    } else if (!accountId && accounts.length > 0) { 

      setAccountId(accounts.find((a: any) => a.is_default)?.id || accounts[0].id); 

    } 

  }, [paymentMethod, accounts, accountId]); 

``` 

 

Ensure `useEffect` is imported. Then hide the account picker on credit by wrapping the `SearchableSelect` with `label="Paid From Account"` in `{paymentMethod !== 'credit' && ( ... )}`. 

 

Finally, if `src/lib/types.ts` has a hand-written `PaymentMethod` union, add `'credit'` to it. 

 

## Verify 

 

```bash 

cd shambala 

grep -rn "'credit' as any" src/       # NO OUTPUT 

grep -rn "!== 'credit'" src/actions/  # 5+ lines 

npx tsc --noEmit && npx next build 

``` 

 

**The proof:** `/labour/add` → worker, **₹2000**, Payment Method = **Credit (pay later)**. The account picker must disappear. Save. 

 

```sql 

SELECT v.voucher_no, la.name, vl.debit, vl.credit 

FROM vouchers v JOIN voucher_lines vl ON vl.voucher_id = v.id 

JOIN ledger_accounts la ON la.id = vl.ledger_id 

WHERE v.reference_table='labour_records' ORDER BY v.created_at DESC LIMIT 4; 

-- expected: exactly 2 lines (accrual only). No PV-LAB-*. 

 

SELECT balance FROM ledger_balances WHERE name='Worker Payable' 

  AND project_id='10000000-0000-0000-0000-000000000000'; 

-- expected: 2000. Before this fix it was ALWAYS 0. 

``` 

 

Cash must be unchanged. Then save another with **Cash** — the normal path must still post all 4 lines. 

 

## Do NOT 

 

- Don't try to remove `'credit'` later — Postgres can't drop an enum value without recreating the type. 

- Don't batch the `ALTER TYPE` with other statements. 

- Don't make `account_id` required in the forms. 

- Don't build a "settle payable" screen here — recording the debt correctly comes first. 

 

--- 

 

# FIX 12 — Machinery: wrong ledger, missing `reference_id` 

 

**MEDIUM.** Depends on: fix 1. 

 

## Problem 
**A.** Line 83 of `src/actions/machinery.ts`: 

```ts 

    const machineryExpenseLedgerId = await getLedgerId('Labour Expense'); // Assuming operator is labour 

``` 

The comment admits it. Machinery hire inflates **Labour Expense** in the ledger while `reports.ts` reports it separately — **the two can never reconcile.** 

 

**B.** Line 15 uses `const { error } = await supabase.from('machinery_records').insert({` with no `.select('id')`, so `reference_id` is NULL on all four of its vouchers. They can't be traced, reversed (fix 10), or audited. Every other module does capture the id. 

 

## Files 

 

EDIT `shambala/src/actions/machinery.ts` 

 

## Steps 

 

**1.** Line 15: `const { error } =` → `const { data: record, error } =`, and change that insert's closing `});` to `}).select('id').single();` 

 

**2.** Line 32: `const { error: fuelError } =` → `const { data: fuelRecord, error: fuelError } =`, same `.select('id').single()` treatment. 

 

**3.** Line 47 FIND: 

```ts 

    if (fuelError) console.error('Failed to save fuel record', fuelError); 

``` 

REPLACE: 

```ts 

    if (fuelError) { 

      console.error('Failed to save fuel record', fuelError); 

      throw new Error('Failed to save fuel record'); 

    } 

``` 

**Throw, don't log** — the code posts fuel vouchers immediately after. A silent failure records an expense with no operational record behind it. 

 

**4.** FIND `await getLedgerId('Labour Expense'); // Assuming operator is labour` 

REPLACE `await getLedgerId('Machinery Expense');` 

(`Worker Payable` stays — the credit is what you owe the operator. Only the expense side was wrong.) 

 

**5.** Add a `reference_id` line beneath each of the four `reference_table` lines: 

 

| Voucher | `reference_table` | Add | 

|---|---|---| 

| `JV-FUEL-*`, `PV-FUEL-*` | `'fuel_records'` | `reference_id: fuelRecord.id,` | 

| `JV-MAC-*`, `PV-MAC-*` | `'machinery_records'` | `reference_id: record.id,` | 

 

## Verify 

 

```bash 

cd shambala 

grep -n "getLedgerId('Labour Expense')" src/actions/machinery.ts     # NO OUTPUT 

grep -n "reference_table\|reference_id" src/actions/machinery.ts     # in PAIRS, 4 of each 

npx tsc --noEmit && npx next build 

``` 

 

Save a machinery record with an amount **and** fuel, then: 

```sql 

SELECT voucher_no, reference_table, reference_id FROM vouchers 

WHERE reference_table IN ('machinery_records','fuel_records') 

ORDER BY created_at DESC LIMIT 4; 

-- expected: reference_id NOT NULL on all four 

``` 

Confirm `Machinery Expense` increased and `Labour Expense` is unchanged. 

 

## Do NOT 

 

- Don't backfill `reference_id` on old vouchers — the link was never stored. Report the NULL count. 

- Don't create a separate machinery payable ledger. 

- Don't change `reports.ts` here. 

 

--- 

 

# FIX 13 — Monthly report drops transport and fuel 

 

**MEDIUM.** Depends on: fixes 1, 5. 

 

## Problem 

 

`getMonthlyReport` in `src/actions/reports.ts` — the transport query is triple-broken: 

 

```ts 

.from('transport_trips') 

.select('*, ..., delivery:material_deliveries(project_id, date)') 

.eq('status', 'completed'),        // no project filter, no date filter 

``` 

```ts 

  if (!delivery) return false;     // drops every standalone trip 

  return delivery.project_id === DEFAULT_PROJECT_ID && ...  // wrong columns 

``` 

 

1. Fetches **every trip ever** (capped at 1,000), filters in JS 

2. Filters on the *joined delivery's* `project_id`/`date` even though `transport_trips` has **its own** (added in migration `004`) 

3. `if (!delivery) return false` **drops every standalone trip** — exactly what `createStandaloneTransportRecord` creates 

 

Plus: **`fuel_records` is missing from the report entirely** (diesel is a major cost), and all six queries hit the same 1,000-row cap as fix 5. 

 

The inline comment blaming "Supabase nested filter limitations" is wrong — you can filter a table's own columns. 

 

## Files 

 

CREATE `supabase/migrations/011_module_spend.sql` · EDIT `src/actions/reports.ts` (`getMonthlyReport` only) 

 

## Step 1 — Aggregating view 

 

```sql 

-- 011_module_spend.sql 

-- One row per (project, month, module). Aggregating in SQL avoids the 

-- PostgREST 1000-row cap that silently truncated these totals. 

 

CREATE OR REPLACE VIEW module_spend_monthly AS 

  SELECT project_id, DATE_TRUNC('month', date)::DATE AS month, 

         'labour' AS module, COALESCE(SUM(amount),0)::NUMERIC(15,2) AS total 

  FROM labour_records WHERE amount IS NOT NULL 

  GROUP BY project_id, DATE_TRUNC('month', date) 

UNION ALL 

  SELECT project_id, DATE_TRUNC('month', start_date)::DATE, 'food', 

         COALESCE(SUM(amount),0)::NUMERIC(15,2) 

  FROM food_records WHERE amount IS NOT NULL 

  GROUP BY project_id, DATE_TRUNC('month', start_date) 

UNION ALL 

  SELECT project_id, DATE_TRUNC('month', date)::DATE, 'machinery', 

         COALESCE(SUM(amount),0)::NUMERIC(15,2) 

  FROM machinery_records WHERE amount IS NOT NULL 

  GROUP BY project_id, DATE_TRUNC('month', date) 

UNION ALL 

  SELECT project_id, DATE_TRUNC('month', payment_date)::DATE, 'salary', 

         COALESCE(SUM(amount),0)::NUMERIC(15,2) 

  FROM salary_records WHERE amount IS NOT NULL 

  GROUP BY project_id, DATE_TRUNC('month', payment_date) 

UNION ALL 

  SELECT project_id, DATE_TRUNC('month', date)::DATE, 'materials', 

         COALESCE(SUM(material_cost),0)::NUMERIC(15,2) 

  FROM material_deliveries WHERE material_cost IS NOT NULL 

  GROUP BY project_id, DATE_TRUNC('month', date) 

UNION ALL 

  -- Uses transport_trips' OWN project_id and date, so standalone trips 

  -- (no delivery_id) are included. 

  SELECT project_id, DATE_TRUNC('month', date)::DATE, 'transport', 

         COALESCE(SUM(amount),0)::NUMERIC(15,2) 

  FROM transport_trips 

  WHERE amount IS NOT NULL AND COALESCE(status,'completed') = 'completed' 

  GROUP BY project_id, DATE_TRUNC('month', date) 

UNION ALL 

  -- Previously missing from every report. 

  SELECT project_id, DATE_TRUNC('month', date)::DATE, 'fuel', 

         COALESCE(SUM(amount),0)::NUMERIC(15,2) 

  FROM fuel_records WHERE amount IS NOT NULL 

  GROUP BY project_id, DATE_TRUNC('month', date); 

 

GRANT SELECT ON module_spend_monthly TO authenticated; 

``` 

 

## Step 2 — Rewrite `getMonthlyReport` 

 

Replace the whole function (~lines 13–87): 

 

```ts 

const MODULE_META: Record<string, { label: string; icon: string }> = { 

  labour:    { label: 'Labour',           icon: '👷' }, 

  food:      { label: 'Food & Groceries', icon: '🍚' }, 

  machinery: { label: 'Machinery',        icon: '🚜' }, 

  salary:    { label: 'Salary',           icon: '💰' }, 

  materials: { label: 'Materials',        icon: '🧱' }, 

  transport: { label: 'Transport',        icon: '🚚' }, 

  fuel:      { label: 'Fuel',             icon: '⛽' }, 

}; 

 

export async function getMonthlyReport( 

  year: number, month: number 

): Promise<{ modules: ModuleSpend[]; grandTotal: number }> { 

  const supabase = await createClient(); 

  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`; 

 

  // Aggregated in Postgres — see migration 011. 

  const { data, error } = await supabase 

    .from('module_spend_monthly') 

    .select('module, total') 

    .eq('project_id', DEFAULT_PROJECT_ID) 

    .eq('month', firstDay); 

 

  if (error) throw new Error(error.message); 

 

  const totals = new Map<string, number>(); 

  for (const row of data || []) totals.set(row.module, Number(row.total) || 0); 

 

  // Always emit every module, so a zero month still renders all rows. 

  const modules: ModuleSpend[] = Object.entries(MODULE_META).map(([key, meta]) => ({ 

    module: key, label: meta.label, icon: meta.icon, total: totals.get(key) ?? 0, 

  })); 

 

  return { modules, grandTotal: modules.reduce((s, m) => s + m.total, 0) }; 

} 

``` 

 

**Not double counting:** `fuel_records.amount` is diesel cost, `machinery_records.amount` is the hire charge. Distinct costs. 

 

## Verify 

 

```bash 

grep -n "filteredTransport" src/actions/reports.ts   # NO OUTPUT 

npx tsc --noEmit && npx next build 

``` 

 

**The key fix:** create a standalone transport record for **₹3000** at `/transport/add` (no delivery), then: 

```sql 

SELECT total FROM module_spend_monthly 

WHERE project_id='10000000-0000-0000-0000-000000000000' AND module='transport' 

  AND month=DATE_TRUNC('month',CURRENT_DATE)::DATE; 

-- expected: includes the ₹3000. Before: dropped by `if (!delivery) return false`. 

``` 

Also add a machinery record with ₹1500 fuel and confirm a **Fuel** line appears on `/reports`. 

 

## Do NOT 

 

- Don't touch `getBuildingReport` — same row-cap issue, needs its own view. Note as follow-up. 

- Don't touch `getDayBook` (**fix 9**). 

- Don't drop zero-total modules; the UI expects a stable list. 

 

--- 

 

# FIX 14 — `/api/export` 500s on every request 

 

**MEDIUM** — a headline feature that has never worked. Depends on: fix 6. 

 

## Problem 

 

`src/app/api/export/route.ts` has three fatal bugs: it selects `category:categories(name)` (**no such table**), filters `.is('deleted_at', null)` (**no such column**), and the UI's filter values `expense`/`income`/`salary` **aren't in the `transaction_type` enum**. The client swallows the failure with a bare `console.error`, so the button does nothing forever. 

 

It also reads `transactions` — the dead table. **The export must read vouchers.** 

 

## Files 

 

EDIT `src/app/api/export/route.ts` and `src/app/more/export/page.tsx` 

 

## Step 1 — Rewrite the route 

 

Replace the **entire file**: 

 

```ts 

import { APP_NAME, DEFAULT_PROJECT_ID } from '@/lib/constants'; 

import { NextRequest, NextResponse } from 'next/server'; 

import * as XLSX from 'xlsx'; 

import { createClient } from '@/lib/supabase/server'; 

 

const VALID_GROUPS = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as const; 

type Group = (typeof VALID_GROUPS)[number]; 

 

export async function GET(request: NextRequest) { 

  try { 

    const supabase = await createClient(); 

 

    const { data: { user } } = await supabase.auth.getUser(); 

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); 

 

    const sp = request.nextUrl.searchParams; 

    const group = sp.get('group') || 'all'; 

    const month = sp.get('month'); 

    const year = sp.get('year'); 

 

    if (group !== 'all' && !VALID_GROUPS.includes(group as Group)) { 

      return NextResponse.json({ error: `Invalid group: ${group}` }, { status: 400 }); 

    } 

 

    let query = supabase 

      .from('voucher_lines') 

      .select(` 

        debit, credit, 

        ledger:ledger_accounts!inner(name, account_group), 

        party:parties(name), 

        cost_center:buildings(display_name), 

        voucher:vouchers!inner(voucher_no, type, date, narration, project_id, is_reversed) 

      `) 

      .eq('voucher.project_id', DEFAULT_PROJECT_ID) 

      .eq('voucher.is_reversed', false); 

 

    if (group !== 'all') query = query.eq('ledger.account_group', group); 

 

    if (month && year) { 

      const m = parseInt(month, 10), y = parseInt(year, 10); 

      if (Number.isNaN(m) || Number.isNaN(y) || m < 1 || m > 12) { 

        return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 }); 

      } 

      const firstDay = `${y}-${String(m).padStart(2, '0')}-01`; 

      const lastDay = new Date(y, m, 0).toLocaleDateString('en-CA'); 

      query = query.gte('voucher.date', firstDay).lte('voucher.date', lastDay); 

    } 

 

    const { data, error } = await query; 

    if (error) throw new Error(error.message); 

 

    const first = <T,>(v: T | T[] | null | undefined): T | null => 

      Array.isArray(v) ? (v[0] ?? null) : (v ?? null); 

 

    const rows = (data || []).map((line: any) => { 

      const voucher = first(line.voucher), ledger = first(line.ledger); 

      const party = first(line.party), costCenter = first(line.cost_center); 

      return { 

        Date: voucher?.date ?? '', 

        'Voucher No': voucher?.voucher_no ?? '', 

        'Voucher Type': voucher?.type ?? '', 

        Ledger: ledger?.name ?? '', 

        Group: ledger?.account_group ?? '', 

        Party: party?.name ?? '', 

        'Cost Center': costCenter?.display_name ?? '', 

        Debit: Number(line.debit) || 0, 

        Credit: Number(line.credit) || 0, 

        Narration: voucher?.narration ?? '', 

      }; 

    }); 

 

    rows.sort((a, b) => String(a.Date).localeCompare(String(b.Date))); 

 

    const ws = XLSX.utils.json_to_sheet(rows); 

    ws['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 12 }, 

                   { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 40 }]; 

 

    const wb = XLSX.utils.book_new(); 

    XLSX.utils.book_append_sheet(wb, ws, 'Ledger'); 

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }); 

 

    return new NextResponse(buf, { 

      headers: { 

        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 

        'Content-Disposition': `attachment; filename="${APP_NAME.toLowerCase()}-ledger-${new Date().toLocaleDateString('en-CA')}.xlsx"`, 

      }, 

    }); 

  } catch (err) { 

    console.error('Export error:', err); 

    return NextResponse.json( 

      { error: err instanceof Error ? err.message : 'Export failed' }, { status: 500 }); 

  } 

} 

``` 

 

## Step 2 — Fix the UI 

 

In `src/app/more/export/page.tsx`: 
 

- `new URLSearchParams({ type: exportType })` → `{ group: exportType }` 

- FIND `if (!response.ok) throw new Error('Export failed');` REPLACE: 

  ```tsx 

        if (!response.ok) { 

          const body = await response.json().catch(() => ({})); 

          throw new Error(body.error || `Export failed (${response.status})`); 

        } 

  ``` 

- Replace the four option values with: `all` → "Full Ledger", `Expense` → "Expenses Only", `Asset` → "Cash & Assets", `Liability` → "Payables Only" 

- In the catch, add `alert(err instanceof Error ? err.message : 'Export failed');` — a deliberate stopgap; **fix 17** replaces it with the toast system. 

 

## Verify 

 

```bash 

cd shambala 

grep -n "categories\|deleted_at" src/app/api/export/route.ts   # NO OUTPUT 

npx tsc --noEmit && npx next build 

curl -i "http://localhost:3000/api/export?group=NotAGroup"     # expected: HTTP 400 

``` 

 

With data present, `/more/export` → Download Excel → an `.xlsx` must download and open with columns `Date, Voucher No, Voucher Type, Ledger, Group, Party, Cost Center, Debit, Credit, Narration`. Before, nothing happened. Total debits must equal total credits. 

 

## Do NOT 

 

- Don't try to make the old `transactions` query work. 

- Don't remove the auth check or leave the silent catch. 

- Don't replace `xlsx` here — that's fix 20a. 

 

--- 

 

# FIX 15 — Disable the broken `/api/import` 

 

**MEDIUM** — fails 100% of rows and reports it as normal. Depends on: fix 6. 

 

## Problem 

 

Four independent bugs: inserts `parties.type` (column is `class`, NOT NULL), references `transactions.category_id` (doesn't exist), uses type `'expense'` (not in the enum), and a `DEFAULT_CASH_ACCOUNT_ID` that was never seeded (FK violation). It writes to the dead table too. 

 

And it returns `{ imported: 0, failed: N }` with **HTTP 200**, so the UI renders it as a normal outcome. 

 

**Why disable rather than rewrite:** a correct importer means mapping spreadsheet rows onto the double-entry model, resolving ledgers and parties, deduplicating and validating — a multi-day feature, not a bug fix. **A feature that silently destroys data confidence is worse than no feature.** 

 

> If the owner says the import is still required, **stop and escalate.** Don't attempt the rewrite here. 

 

## Files 

 

EDIT `src/app/api/import/route.ts`, `src/app/import/page.tsx`, and `src/app/more/page.tsx` if it links to `/import` 

 

## Steps 

 

**1.** Replace the entire route file: 

 

```ts 

import { NextResponse } from 'next/server'; 

 

/** 

 * DISABLED — written against a schema that no longer exists; failed on 100% of rows: 

 *   - inserted `parties.type`; the column is `class` (NOT NULL) 

 *   - referenced `transactions.category_id`, which does not exist 

 *   - used transaction type 'expense', not in the transaction_type enum 

 *   - referenced hardcoded account UUIDs that were never seeded 

 *   - wrote to `transactions`, the legacy table the app no longer reads 

 * 

 * Rebuilding means mapping spreadsheet rows onto the double-entry voucher model. 

 * That is a feature, not a bug fix. Until then this reports honestly. 

 */ 

export async function POST() { 

  return NextResponse.json( 

    { 

      error: 'Excel import is temporarily disabled', 

      detail: 'The importer targeted an outdated schema and failed on every row. ' + 

              'It needs to be rebuilt against the double-entry ledger.', 

    }, 

    { status: 501 } 

  ); 

} 

``` 

 

**2.** **Don't delete** `src/app/import/page.tsx` (breaks links). Replace its contents with a notice using classes that actually exist — `bg-bg-card`, `text-amber`, `text-text-secondary`. Avoid `bg-bg`/`text-text` (broken, see fix 18): 

 

```tsx 

export default function ImportPage() { 

  return ( 

    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto"> 

      <h1 className="text-2xl font-bold mb-4">Excel Import</h1> 

      <div className="bg-bg-card border border-amber/30 rounded-2xl p-5"> 

        <p className="text-amber font-semibold mb-2">⚠️ Temporarily unavailable</p> 

        <p className="text-text-secondary text-sm leading-relaxed"> 

          The Excel importer was built for an earlier version of the database and 

          could not save any rows. It has been disabled while it is rebuilt against 

          the current accounting ledger. 

        </p> 

        <p className="text-text-secondary text-sm leading-relaxed mt-3"> 

          To add historical records meanwhile, use the entry screens for Labour, 

          Materials, Food, Machinery, Salary and Transport. 

        </p> 

      </div> 

    </div> 

  ); 

} 

``` 

 

**3.** `grep -rn "'/import'" shambala/src/` — remove the nav link if present. 

 

**4.** **Keep** `src/lib/excel-parser.ts` — it holds real domain knowledge (sheet detection, date parsing, classification) worth salvaging. Add a banner at the top noting it's unused, the route is disabled, and its hardcoded categoryId UUIDs point at a non-existent `categories` table. 

 

## Verify 

 

```bash 

cd shambala 

grep -n "501" src/app/api/import/route.ts      # 1 line 

npx tsc --noEmit && npx next build 

curl -i -X POST http://localhost:3000/api/import -H "Content-Type: application/json" -d '{"rows":[]}' 

# expected: HTTP/1.1 501 Not Implemented 

``` 

Load `/import` and confirm the notice renders without crashing. 

 

## Do NOT 

 

- Don't rewrite the importer here, or delete `excel-parser.ts` / `import/page.tsx`. 

- Don't return HTTP 200 — the point is that failure is visible. 

 

**Follow-up ticket:** a correct importer needs a staging table with a review UI, row→voucher mapping, fuzzy party matching, idempotency so re-runs don't double-import, and a dry-run mode. 

 

--- 

 

# FIX 16 — `/api/backup` omits the entire ledger 

 

**MEDIUM** — users are told this is a "full backup". It isn't. Depends on: fix 6. 

 

## Problem 

 

It backs up 15 hardcoded tables, **missing `vouchers`, `voucher_lines`, `ledger_accounts`, `transport_trips`** and ~11 more. The first three *are* the financial records. It includes `transport_records` (dead) but not `transport_trips` (live). 

 

Two more bugs: errors become `backupData[table] = []`, so **a broken backup looks successful**; and `.select('*')` caps at 1,000 rows, so **the backup is silently truncated**. 

 

## Files 

 

EDIT `src/app/api/backup/route.ts` and `src/app/more/export/page.tsx` (wording) 

 

## Steps 

 

**1.** Replace the route's table list with all 30, parents first for restore ordering: 

 

```ts 

const TABLES = [ 

  'projects', 'ledger_accounts', 'accounts', 'buildings', 'worker_types', 

  'work_types', 'parties', 'materials', 'material_variants', 'machinery', 

  'transport_vehicles', 'weighbridges', 'fuel_types', 'food_categories', 

  'general_store_categories', 'general_store_items', 

  'labour_records', 'food_records', 'salary_records', 'machinery_records', 

  'fuel_records', 'material_deliveries', 'transport_trips', 'transport_records', 

  'weighbridge_records', 

  'vouchers', 'voucher_lines', 'bill_allocations', 'fiscal_periods', 

  'transactions', 

] as const; 

``` 

 

**2.** Add a paging helper and use it instead of `.select('*')`: 

 

```ts 

const PAGE_SIZE = 1000; 

 

/** Pages through a table so backups aren't silently capped at 1000 rows. */ 

async function fetchAll( 

  supabase: Awaited<ReturnType<typeof createClient>>, table: string 

): Promise<Record<string, unknown>[]> { 

  const rows: Record<string, unknown>[] = []; 

  let from = 0; 

  for (;;) { 

    const { data, error } = await supabase.from(table).select('*') 

      .range(from, from + PAGE_SIZE - 1); 

    // Fail loudly. A backup that silently omits a table is worse than none. 

    if (error) throw new Error(`Backup failed reading "${table}": ${error.message}`); 

    const batch = data || []; 

    rows.push(...batch); 

    if (batch.length < PAGE_SIZE) break; 

    from += PAGE_SIZE; 

  } 

  return rows; 

} 

``` 

 

**3.** In `GET`, add the 401 auth check, build `rowCounts` alongside the data, and bump `version` to `'2.0'`. **Delete the `backupData[table] = []` fallback** — on error, return HTTP 500 with `detail: 'No file was produced. Do not treat this as a successful backup.'` 

 

**4.** In the UI, stop promising a restore that doesn't exist: 

 

```tsx 

        <p className="text-text-secondary text-sm mb-4"> 

          Download a raw JSON snapshot of every table, including the full accounting 

          ledger. Store it somewhere safe. 

        </p> 

        <p className="text-text-muted text-xs mb-4"> 

          Note: there is no automated restore yet. This file is a data snapshot — 

          restoring it currently requires manual work in the Supabase dashboard. 

        </p> 

``` 

 

Replace `window.location.href = '/api/backup'` with a `fetch` + blob download that surfaces errors (this also clears the ESLint `no-location-assign-relative-destination` error). 

 

## Verify 

 

```bash 

cd shambala 

grep -n "'vouchers'\|'voucher_lines'\|'ledger_accounts'" src/app/api/backup/route.ts  # 3 lines 

grep -n "backupData\[table\] = \[\]" src/app/api/backup/route.ts                      # NO OUTPUT 

npx tsc --noEmit && npx next build 

``` 

 

Download the backup: `version` must be `"2.0"`, `rowCounts` must list ~30 tables, `data.ledger_accounts` must have 12 entries, and `rowCounts.voucher_lines` must equal `SELECT COUNT(*) FROM voucher_lines`. Logged out, `curl -i /api/backup` → **401**. 

 

## Do NOT 

 

- Don't re-add the silent `= []` fallback or claim a restore feature exists. 

- Don't build the restore endpoint here — it needs careful FK ordering. 

- Don't remove `transport_records`/`transactions`; legacy but may hold data. 

 

--- 

 

# FIX 17 — Errors are invisible to the user 

 

**MEDIUM** — failures look identical to "no data". Depends on: nothing. 

 

## Problem 

 

Five pages swallow load failures: 

```tsx 

} catch (err) { 

  console.error('Failed to load report data', err); 

} finally { setLoading(false); } 

``` 

 

`loading` flips false and the page renders its **empty state**, so the user sees "No records found" for what is actually a server error. This is *why* the app appears inert rather than broken. 

 

**The toast system already exists** (`src/components/Toast.tsx`, mounted in `layout.tsx`). Forms use it; read paths don't. 

 

## Files 

 

EDIT `src/components/Toast.tsx` plus `reports/page.tsx`, `expenses/page.tsx`, `more/people/[id]/page.tsx`, `more/people/page.tsx`, `money/transfer/page.tsx` 

 

## Step 1 — Three Toast bugs 

 

Replace the state and `addToast` section of `ToastProvider` with: 

 

```tsx 

  const [toasts, setToasts] = useState<Toast[]>([]); 

  const nextId = useRef(0); 

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]); 

 

  // Clear pending timers on unmount so we never setState on a dead component. 

  useEffect(() => { 

    const pending = timers.current; 

    return () => pending.forEach(clearTimeout); 

  }, []); 

 

  const addToast = useCallback((message: string, type: ToastType) => { 

    // Date.now() collides when two toasts fire in the same millisecond, 

    // producing duplicate React keys. 

    const id = nextId.current++; 

    setToasts((prev) => [...prev, { id, message, type }]); 

    const timer = setTimeout(() => { 

      setToasts((prev) => prev.filter((t) => t.id !== id)); 

    }, 4000); 

    timers.current.push(timer); 

  }, []); 

 

  const success = useCallback((m: string) => addToast(m, 'success'), [addToast]); 

  const error = useCallback((m: string) => addToast(m, 'error'), [addToast]); 

  const info = useCallback((m: string) => addToast(m, 'info'), [addToast]); 

 

  // Memoised so consumers don't re-render on every provider render. 

  const value = useMemo(() => ({ success, error, info }), [success, error, info]); 

``` 

 

Change `<ToastContext.Provider value={{ success, error, info }}>` to `value={value}` and extend the React import with `useRef, useCallback, useMemo, useEffect`. 

 

Fixes: duplicate React keys from `Date.now()`; timers never cleared on unmount; a fresh context object every render re-rendering all consumers. 

 

## Step 2 — Surface errors on each page 

 

Add `const toast = useToast();` and `const [loadError, setLoadError] = useState<string | null>(null);`. Set `setLoadError(null)` when a load starts, and in each catch: 

 

```tsx 

      } catch (err) { 

        console.error('Failed to load report data', err); 

        const message = err instanceof Error ? err.message : 'Failed to load report data'; 

        setLoadError(message); 

        toast.error(message); 

      } finally { 

``` 

 

Render a persistent banner inside the returned JSX: 

 

```tsx 

      {loadError && ( 

        <div className="mb-4 p-4 rounded-2xl border border-red-light/30 bg-red-light/10"> 

          <p className="text-red-light text-sm font-semibold mb-1">Could not load data</p> 

          <p className="text-text-secondary text-xs">{loadError}</p> 

        </div> 

      )} 

``` 

 

Toast **and** banner: the toast catches attention, the banner persists so the user isn't staring at an empty list. Find remaining cases with `grep -rn "console.error" shambala/src/app/ | grep -v toast`. Also replace any `alert(...)` left by fixes 14/16 with `toast.error(...)`. 

 

## Verify 

 

```bash 

cd shambala 

grep -rn "console.error" src/app/ | grep -v "toast.error" | grep -v "error.tsx"  # NO OUTPUT 

grep -n "Date.now()" src/components/Toast.tsx                                    # NO OUTPUT 

npx tsc --noEmit && npx next build 

``` 

 

Temporarily point a query at an invalid table name, load the page, and confirm a red toast **and** the banner appear. **Revert immediately.** 

 

## Do NOT 

 

- Don't remove the `console.error` calls — keep them, just add user feedback. 

- Don't leave `alert()` as the final solution, or add toasts to Server Components (`useToast` is a client hook). 

- Don't swallow errors in server actions to avoid the toast — actions must keep throwing. 

 

--- 

 

# FIX 18 — 283 broken Tailwind classes 

 

**MEDIUM** — every form input renders transparent. Depends on: nothing. 

 

## Problem 

 

`globals.css` defines `--color-bg-primary`, `--color-bg-card`, `--color-bg-input`, `--color-text-primary`, etc. in a Tailwind v4 `@theme` block. **There is no `--color-bg` and no `--color-text`** — yet `bg-bg` and `text-text` appear **283 times**: 

 

```tsx 

<input className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text ..." /> 

<!--                     ^^^^^ no such class            ^^^^^^^^^ no such class --> 

``` 

 

Tailwind emits nothing, so those elements fall back to transparent background and inherited text colour. 

 

**Why nobody noticed:** `bg-bg-card` and `text-text-muted` *do* resolve, so cards and labels look right while the inputs inside them are transparent. Reads as a design quirk, not a bug. 

 

Worst offenders: `page.tsx` files (138), `MaterialsForm` (26), `MachineryForm` (24), `TransportForm` (15), `SearchableSelect` (14). 

 

## Decision: add aliases, don't rename 283 usages 

 

One small change, no regex risk, reversible. Intent is clear from context — `bg-bg` sits on `<input>` elements (`--color-bg-input`), `text-text` is body text (`--color-text-primary`). 

 

## Files 

 

EDIT `shambala/src/app/globals.css` — only this file. 

 

## Steps 

 

Confirm first: 

```bash 

cd shambala 

grep -rEo '\b(bg-bg|text-text)\b' src/ | wc -l    # ~283 

grep -n "\-\-color-bg:" src/app/globals.css       # NO OUTPUT 

``` 

 

**Inside the `@theme { }` block**, after `--color-bg-input: #1e1e2d;` add: 

```css 

  /* `bg-bg` is used ~140 times, almost entirely on form inputs. Without this 

     alias Tailwind emits nothing and those inputs render transparent. */ 

  --color-bg: #1e1e2d; 

``` 

And after `--color-text-muted: #5a5a6e;` add: 

```css 

  /* `text-text` is used ~140 times and means body text. */ 

  --color-text: #f1f1f5; 

``` 

 

## Verify 

 

```bash 

cd shambala 

npx next build 

grep -o "\.bg-bg{[^}]*}" .next/static/css/*.css | head -5      # expect #1e1e2d 

grep -o "\.text-text{[^}]*}" .next/static/css/*.css | head -5  # expect #f1f1f5 

sed -n '/@theme/,/^}/p' src/app/globals.css | grep -c "color-bg:\|color-text:"  # 2 

``` 

 

Empty greps mean the alias didn't register — check you edited **inside** `@theme { }`. 

 

**Visual check (the real test):** `/labour/add` — the Date and Amount inputs must now have a distinctly darker `#1e1e2d` background instead of showing the card colour through. Also check `/materials/add`, `/machinery/add`, `/money/transfer`. 

 

## Do NOT 

 

- **Don't blind find/replace `bg-bg` → `bg-bg-input`.** `bg-bg` is a **prefix** of `bg-bg-card`, `bg-bg-elevated`, `bg-bg-input`, `bg-bg-primary`, `bg-bg-secondary` — a naive replace corrupts all of them. This is exactly why the alias is safer. 

- Don't add the variables outside `@theme` — Tailwind v4 only generates utilities from tokens inside it. 

- Don't edit any `.tsx` file in this fix. 

 

--- 

 

# FIX 19 — Security, validation, schema hygiene 

 

**MEDIUM.** Four independent items — **do them one at a time.** 

 

## 19a — `updateParty` mass assignment 

 

`src/actions/parties.ts` does `.update(data).eq('id', id)` — the caller controls **every column** including `project_id` (move a party to another tenant), `id`, and `created_at`. `Partial<Party>` is compile-time only. There's no project scope either. 

 

Build the patch explicitly — **allowlist, never denylist** (denylists fail open as columns are added): 

 

```ts 

  const patch: Record<string, unknown> = {}; 

  if (data.name !== undefined) patch.name = data.name?.trim(); 

  if (data.class !== undefined) patch.class = data.class; 

  if (data.role !== undefined) patch.role = data.role; 

  if (data.worker_type_id !== undefined) patch.worker_type_id = data.worker_type_id || null; 

  if (data.phone !== undefined) patch.phone = data.phone || null; 

  if (data.notes !== undefined) patch.notes = data.notes || null; 

  if (data.is_active !== undefined) patch.is_active = data.is_active; 

 

  if (Object.keys(patch).length === 0) throw new Error('No updatable fields provided'); 

``` 

 

then `.update(patch).eq('id', id).eq('project_id', DEFAULT_PROJECT_ID)`. 

 

Use `!== undefined`, not truthiness — otherwise you can never *clear* a phone number. Add the same `project_id` scope to `getParty` and `deleteParty`. Keep `deleteParty` a soft delete (`is_active = false`). 

 

## 19b — No auth check in any server action 

 

```bash 

grep -rn "auth.getUser" shambala/src/actions/     # today: NO OUTPUT 

``` 

 

Middleware guards page navigations only; Server Actions are separate endpoints. Create `src/lib/auth.ts`: 

 

```ts 

import { createClient } from '@/lib/supabase/server'; 

 

export async function requireUser() { 

  const supabase = await createClient(); 

  const { data: { user }, error } = await supabase.auth.getUser(); 

  if (error || !user) throw new Error('Unauthorized'); 

  return user; 

} 

``` 

 

**Use `getUser()`, never `getSession()`** — `getSession()` reads the cookie without verifying it, so a forged cookie passes. 

 

Add `await requireUser();` as the **first statement** of every exported action (~40 across 13 files, **reads included** — `getSalaryRecords` exposes everyone's pay). If a function starts with `try {`, put the guard **before** it so auth failures aren't swallowed. 

 

API routes return 401 instead: 

```ts 

    const { data: { user } } = await supabase.auth.getUser(); 

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); 

``` 

 

Also tighten the middleware matcher — the current one exempts anything ending `.svg|.png|.jpg|.jpeg|.gif|.webp`: 

```ts 

    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png).*)', 

``` 

 

## 19c — No validation anywhere 

 

Actions accept whatever JSON they're sent. Negative amounts reach `post_voucher` and trip a raw Postgres CHECK, giving an opaque error. `LabourForm` doesn't mark the worker required though `worker_id` is NOT NULL. 

 

`npm install zod`, then create `src/lib/schemas.ts`: 

 

```ts 

import { z } from 'zod'; 

 

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'); 

const money = z.number().positive('Amount must be greater than zero') 

  .max(10_000_000_000, 'Amount is unrealistically large'); 

const uuid = z.string().uuid('Invalid id'); 

 

export const LabourRecordSchema = z.object({ 

  worker_id: uuid, 

  date: isoDate, 

  amount: money.optional(), 

  building_id: uuid.optional().nullable(), 

  account_id: uuid.optional().nullable(), 

  comments: z.string().max(1000).optional().nullable(), 

}); 

 

/** Throws one readable message — actions surface error.message to the client. */ 

export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T { 

  const result = schema.safeParse(input); 

  if (!result.success) { 

    throw new Error(result.error.issues 

      .map(i => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message)) 

      .join('; ')); 

  } 

  return result.data; 

} 

``` 

 

Call `const input = parseOrThrow(LabourRecordSchema, data);` as the first line of each action, then use `input.` throughout — **including the voucher amounts**, or you'll post unvalidated numbers to the ledger. Repeat for salary, food, transfer and money-in. 

 

On the forms: add `min="0" step="0.01"` to amount inputs, guard required selects, and surface the real message with `toast.error(err instanceof Error ? err.message : '...')`. 

 

## 19d — Indexes and unique constraints 

 

Only **4 indexes** exist in the whole schema and **zero** unique constraints. Every list filters `project_id` and sorts `date`, neither indexed. Nothing prevents duplicate machines or voucher numbers (generated from `Date.now()`, so same-millisecond collisions are possible). 

 

**Check for duplicates first** — a constraint fails if any exist: 

 

```sql 

SELECT 'machinery' AS t, project_id::text, machine_id, COUNT(*) 

FROM machinery GROUP BY project_id, machine_id HAVING COUNT(*) > 1 

UNION ALL 

SELECT 'vouchers', project_id::text, voucher_no, COUNT(*) 

FROM vouchers GROUP BY project_id, voucher_no HAVING COUNT(*) > 1; 

``` 

 

**If any rows come back, STOP and report.** Never delete data to force a constraint through. 

 

```sql 

-- 012_indexes.sql 

CREATE INDEX IF NOT EXISTS idx_labour_project_date ON labour_records (project_id, date DESC); 

CREATE INDEX IF NOT EXISTS idx_food_project_date ON food_records (project_id, start_date DESC); 

CREATE INDEX IF NOT EXISTS idx_salary_project_date ON salary_records (project_id, payment_date DESC); 

CREATE INDEX IF NOT EXISTS idx_machinery_project_date ON machinery_records (project_id, date DESC); 

CREATE INDEX IF NOT EXISTS idx_fuel_project_date ON fuel_records (project_id, date DESC); 

CREATE INDEX IF NOT EXISTS idx_deliveries_project_date ON material_deliveries (project_id, date DESC); 

CREATE INDEX IF NOT EXISTS idx_trips_project_date ON transport_trips (project_id, date DESC); 

CREATE INDEX IF NOT EXISTS idx_vouchers_project_date ON vouchers (project_id, date DESC); 

CREATE INDEX IF NOT EXISTS idx_voucher_lines_voucher ON voucher_lines (voucher_id); 

CREATE INDEX IF NOT EXISTS idx_vouchers_reference ON vouchers (reference_table, reference_id); 

CREATE INDEX IF NOT EXISTS idx_parties_project_active ON parties (project_id, is_active); 

 

ALTER TABLE vouchers ADD CONSTRAINT uq_vouchers_project_no UNIQUE (project_id, voucher_no); 

ALTER TABLE machinery ADD CONSTRAINT uq_machinery_project_id UNIQUE (project_id, machine_id); 

ALTER TABLE materials ADD CONSTRAINT uq_materials_project_name UNIQUE (project_id, name); 

``` 

 

**Deliberately no unique constraint on `parties(project_id, name)`** — two different workers can share a name, and the app soft-deletes rather than removing rows. 

 

--- 

 

# FIX 20 — Cleanup 

 

**LOW.** Independent small items. 

 

## 20a — Vulnerable `xlsx` 

 

``` 

xlsx * — HIGH severity, No fix available 

  Prototype Pollution (GHSA-4r6h-8v6p-xvw6) · ReDoS (GHSA-5pgg-2g8v-p4x9) 

``` 

 

SheetJS stopped publishing to npm after 0.18.5 and self-hosts now — the npm package is frozen and will never be patched. It parses **user-uploaded files**, exactly the described attack path. 

 

```bash 

cd shambala 

npm uninstall xlsx 

npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz 

rm -rf node_modules package-lock.json && npm install && npx next build   # proves CI will work 

``` 

 

Same API, no code changes. If a URL dependency is rejected by your tooling, use `exceljs` instead — but then you must rewrite the sheet-building code in `/api/export`, since the API differs. 

 

## 20b — PWA icons don't exist 

 

`public/manifest.json` declares `/icon-192.png` and `/icon-512.png`. **Neither exists** — `public/` holds only default `create-next-app` SVGs. Both 404, so the app **is not installable** despite the README's claim. 

 

Generate them (theme `#0a0a0f`, accent `#6c5ce7`): 

```bash 

cd shambala/public 

magick -size 512x512 xc:'#0a0a0f' -fill '#6c5ce7' -pointsize 300 \ 

  -gravity center -annotate 0 'S' icon-512.png 

magick icon-512.png -resize 192x192 icon-192.png 

magick icon-512.png -resize 180x180 apple-touch-icon.png 

file icon-*.png   # must report real PNG dimensions 

``` 

 

**Never commit a text placeholder named `.png`** — a corrupt image is worse than a missing one. No image tooling? Report it and ask for a real logo. Also add `"scope": "/"` and a `maskable` icon entry to the manifest. 

 

## 20c — Accessibility 

 

**Zoom is disabled** in `src/app/layout.tsx` — delete `maximumScale: 1,` and `userScalable: false,`. WCAG 1.4.4 failure, and actively hostile in bright sunlight for older users. (Authors usually do this to stop iOS auto-zoom on focus; the real fix is 16px+ input font size, i.e. `text-base` not `text-sm`.) 

 

**`SearchableSelect` is mouse-only.** It's the primary input in every form, built from `<div onClick>` with no `role="combobox"`/`listbox`/`option`, no `aria-expanded`, no arrow-key navigation, no Enter/Escape, no `tabIndex`. A keyboard user cannot fill in a single form. 

 

Minimum fix: make the trigger a real `<button type="button">` (**`type="button"` is essential** — these sit inside `<form>` and would otherwise submit on every click), add the ARIA roles, track an `activeIndex`, focus the search input on open, and handle ArrowUp/ArrowDown/Enter/Escape. 

 

## 20d — Delete scratch scripts 

 

Ten one-off artefacts in `shambala/`: `polish.js`, `fix_imports.js`, `append_seed.js`, `append_types.js`, `extract_types.js`, `replace_dates.js`, `readExcel.js`, `check.js`, `schema.json`, `seed.json`. 

 

None is referenced by `package.json` or imported anywhere. `extract_types.js` hardcodes `C:\Users\akash\.gemini\...` from another machine; `check.js` dumps DB rows using env credentials. Confirm nothing references them, then `git rm` all ten. 

 

**Keep:** `scripts/seedFromExcel.js`, `src/lib/excel-parser.ts`, `src/lib/database.types.ts`, and the repo-root `.claude/` directory. 

 

## 20e — README is substantially wrong 

 

- Says run migrations `001` and `002` — there are **seven** now. Skipping the rest means no `transport_trips`, no `fuel_types`, no accounting engine. 

- `cp .env.local.example .env.local` — **that file doesn't exist.** Create it with placeholders; note `.gitignore` has `.env*` so you must `git add -f`. 

- Says Next.js 15; it's 16.3.3. 

- Project structure lists `expenses/add/page.tsx`, `actions/categories.ts`, `AddExpenseForm.tsx` — **none exist**. 

- Schema section documents `categories`, `transaction_items`, `imports`, `import_rows` — **none exist**. 

- Claims Supabase Storage (unused) and "PWA-ready" (see 20b). 

- Never mentions RLS or the double-entry engine — the app's most important subsystem. 

 

Also document creating the first user: there's no sign-up page, so it's **Authentication → Users → Add user** in the Supabase dashboard with **Auto Confirm** enabled. 

 

## 20f — No tests, no CI 

 

For software computing wages. Every bug in this document shipped because nothing checked for it. 

 

```bash 

cd shambala && npm install -D vitest 

``` 

 

`vitest.config.ts` needs the `@` alias (the codebase imports via `@/lib/...`): 

```ts 

import { defineConfig } from 'vitest/config'; 

import path from 'path'; 

 

export default defineConfig({ 

  test: { environment: 'node', include: ['src/**/*.test.ts'] }, 

  resolve: { alias: { '@': path.resolve(__dirname, './src') } }, 

}); 

``` 

 

Start with pure logic, no database: `formatCurrency` (Indian lakh/crore grouping — `₹1,00,000` not `₹100,000`) and the voucher balancing rule (balanced passes, unbalanced fails, floating-point noise tolerated, accrual+payment nets a payable to zero, an unpaid accrual leaves an outstanding balance). 

 

`.github/workflows/ci.yml` goes at the **repo root**, not inside `shambala/`: 

 

```yaml 

name: CI 

on: [push, pull_request] 

jobs: 

  build: 

    runs-on: ubuntu-latest 

    defaults: 

      run: 

        working-directory: shambala 

    steps: 

      - uses: actions/checkout@v4 

      - uses: actions/setup-node@v4 

        with: 

          node-version: '20' 

          cache: npm 

          cache-dependency-path: shambala/package-lock.json 

      - run: npm ci 

      - run: npx tsc --noEmit 

      - run: npm test 

      - env: 

          NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co 

          NEXT_PUBLIC_SUPABASE_ANON_KEY: dummy-key-for-build 

        run: npx next build 

``` 

 

**Leave lint out of CI for now** — ~120 pre-existing errors would make it red on day one. Add it once the count reaches zero. 

 

--- 

 

# What's already good 

 

Worth preserving as you change things: 

 

- **`@supabase/ssr` cookie handling is textbook-correct** — the `getAll`/`setAll` pattern and middleware refresh flow match official guidance, including the subtle `NextResponse.next({ request })` re-creation. 

- **Secret hygiene is clean** — `.env*` gitignored, `git ls-files` confirms nothing was ever committed. 

- **Choosing double-entry was right.** Most expense trackers use a naive single-entry model and hit a wall. `post_voucher` enforcing `total_debit = total_credit` in one plpgsql transaction is the correct primitive. 

- **Cost centers designed in from day one** — `voucher_lines.cost_center_id → buildings` enables real per-building profitability. 

- **Genuine field UX** — `sessionStorage` form drafts survive accidental back-navigation, `localStorage` recents surface the 3 most-used workers, progressive disclosure keeps the common path to ~4 taps, `loading.tsx` skeletons on every route. Someone thought about a foreman entering data one-handed in the sun. 

- **`Promise.all`** across module queries avoids the obvious waterfall. 

- **Soft-delete on parties** preserves referential integrity for historical records. 

 

--- 

 

# Quick reference 

 

| # | Fix | Priority | Depends on | 

|---|---|---|---| 

| 1 | Seed chart of accounts | BLOCKER | — | 

| 2 | Enable RLS | CRITICAL | 1 | 

| 3 | Allowlist `deleteRecord` | CRITICAL | — | 

| 4 | Transport page dead table | HIGH | — | 

| 5 | Balance truncation | HIGH | 1 | 

| 6 | Type Supabase client | HIGH | — | 

| 7 | *(context: split brain)* | — | — | 

| 8 | Food → vouchers | HIGH | 1 | 

| 9 | Day Book + party ledger | HIGH | 1 | 

| 10 | Reverse vouchers on delete | HIGH | 1, 3 | 

| 11 | Enable credit payments | HIGH | 1 | 

| 12 | Machinery ledger + refs | MEDIUM | 1 | 

| 13 | Monthly report | MEDIUM | 1, 5 | 

| 14 | Fix `/api/export` | MEDIUM | 6 | 

| 15 | Disable `/api/import` | MEDIUM | 6 | 

| 16 | Fix `/api/backup` | MEDIUM | 6 | 

| 17 | Surface errors | MEDIUM | — | 

| 18 | Tailwind tokens | MEDIUM | — | 

| 19 | Security + validation + indexes | MEDIUM | — | 

| 20 | Cleanup | LOW | 14, 15 | 

 

**Migrations created:** `006_seed_ledgers`, `007_rls`, `008_balance_views`, `009_reverse_voucher`, `010_credit_method`, `011_module_spend`, `012_indexes`. 

 

**After every change:** `npx tsc --noEmit` and `npx next build` must both pass. 

 

 