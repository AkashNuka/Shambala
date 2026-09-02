'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { Account, AccountBalance } from '@/lib/types';

export async function getAccounts(): Promise<any[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ledger_accounts')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .in('name', ['Cash', 'Bank'])
    .order('name');

  if (error) throw new Error(error.message);
  
  // Map to legacy format for dropdowns
  return (data || []).map(a => ({
    id: a.id,
    name: a.name,
    type: a.name.toLowerCase(),
    is_default: a.name === 'Cash'
  }));
}

export async function getAccountBalances(): Promise<AccountBalance[]> {
  const supabase = await createClient();

  // Get Cash and Bank ledger accounts
  const { data: ledgers, error: accError } = await supabase
    .from('ledger_accounts')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .in('name', ['Cash', 'Bank']);

  if (accError) throw new Error(accError.message);

  const ledgerIds = (ledgers || []).map(l => l.id);
  
  if (ledgerIds.length === 0) return [];

  const { data: lines, error: lineError } = await supabase
    .from('voucher_lines')
    .select('ledger_id, debit, credit')
    .in('ledger_id', ledgerIds);

  if (lineError) throw new Error(lineError.message);

  const balances: AccountBalance[] = (ledgers || []).map(l => {
    let balance = 0;
    const lLines = (lines || []).filter(line => line.ledger_id === l.id);
    for (const line of lLines) {
      if (l.normal_balance === 'Debit') {
        balance += (line.debit - line.credit);
      } else {
        balance += (line.credit - line.debit);
      }
    }
    return {
      account_id: l.id,
      account_name: l.name,
      account_type: l.name.toLowerCase(), // 'cash' or 'bank'
      balance,
    };
  });

  return balances;
}

export async function getThisMonthSpent(): Promise<number> {
  const supabase = await createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  const firstDay = `${year}-${month}-01`;
  const lastDate = new Date(year, now.getMonth() + 1, 0).getDate();
  const lastDay = `${year}-${month}-${String(lastDate).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('voucher_lines')
    .select(`
      debit,
      credit,
      vouchers!inner(date),
      ledger_accounts!inner(account_group)
    `)
    .eq('ledger_accounts.account_group', 'Expense')
    .gte('vouchers.date', firstDay)
    .lte('vouchers.date', lastDay);

  if (error) throw new Error(error.message);
  
  // Expenses have normal balance Debit, so net expense = sum(debit) - sum(credit)
  return (data || []).reduce((sum, line) => sum + (Number(line.debit) - Number(line.credit)), 0);
}
