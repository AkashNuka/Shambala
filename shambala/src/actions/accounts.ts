'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { Account, AccountBalance } from '@/lib/types';

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('is_default', { ascending: false })
    .order('name');

  if (error) throw new Error(error.message);
  return (data as Account[]) || [];
}

export async function getAccountBalances(): Promise<AccountBalance[]> {
  const supabase = await createClient();

  // Get all accounts
  const { data: accounts, error: accError } = await supabase
    .from('accounts')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID);

  if (accError) throw new Error(accError.message);

  // Get all transactions
  const { data: transactions, error: txnError } = await supabase
    .from('transactions')
    .select('type, amount, account_id, to_account_id')
    .eq('project_id', DEFAULT_PROJECT_ID);

  if (txnError) throw new Error(txnError.message);

  // Calculate balance for each account
  const balances: AccountBalance[] = (accounts || []).map((account: Account) => {
    let balance = account.initial_balance;

    for (const txn of transactions || []) {
      // Money coming IN to this account
      if (txn.account_id === account.id) {
        if (txn.type === 'money_in' || txn.type === 'opening_balance') {
          balance += txn.amount;
        } else if (
          txn.type === 'operational_expense' ||
          txn.type === 'general_expense' ||
          txn.type === 'supplier_payment'
        ) {
          balance -= txn.amount;
        }
      }

      // Transfers
      if (txn.type === 'transfer') {
        if (txn.account_id === account.id) {
          balance -= txn.amount; // transferring FROM this account
        }
        if (txn.to_account_id === account.id) {
          balance += txn.amount; // transferring TO this account
        }
      }
    }

    return {
      account_id: account.id,
      account_name: account.name,
      account_type: account.type,
      balance,
    };
  });

  return balances;
}

export async function getThisMonthSpent(): Promise<number> {
  const supabase = await createClient();

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .in('type', ['operational_expense', 'general_expense', 'supplier_payment'])
    .gte('date', firstDay)
    .lte('date', lastDay);

  if (error) throw new Error(error.message);
  return (data || []).reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
}
