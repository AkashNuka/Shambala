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

  // Aggregated in Postgres — see migration 008. Do not fetch raw voucher_lines
  // and sum in JS; PostgREST truncates at 1000 rows.
  const { data, error } = await (supabase as any)
    .from('ledger_balances')
    .select('ledger_id, name, balance')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .in('name', ['Cash', 'Bank'])
    .order('name');

  if (error) throw new Error(error.message);

  return (data || []).map((l: any) => ({
    account_id: l.ledger_id,
    account_name: l.name,
    account_type: l.name.toLowerCase(),
    balance: Number(l.balance) || 0,
  }));
}

export async function getThisMonthSpent(): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const { data, error } = await (supabase as any)
    .from('monthly_expense_totals')
    .select('total')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .eq('month', firstDay)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Number(data?.total) || 0;
}
