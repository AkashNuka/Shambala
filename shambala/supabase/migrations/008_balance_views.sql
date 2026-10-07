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
