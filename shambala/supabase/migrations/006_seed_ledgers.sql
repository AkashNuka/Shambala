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
