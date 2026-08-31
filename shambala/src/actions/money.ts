'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

export async function addMoneyIn(data: {
  amount: number;
  account_id: string;
  party_id?: string;
  date: string;
  payment_method?: string;
  description?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from('transactions').insert({
    project_id: DEFAULT_PROJECT_ID,
    type: 'money_in',
    amount: data.amount,
    account_id: data.account_id,
    party_id: data.party_id || null,
    date: data.date,
    payment_method: data.payment_method || 'cash',
    description: data.description || 'Cash received',
  });

  if (error) {
    console.error('Failed to record money in:', error);
    throw new Error('Failed to record money in');
  }

  revalidatePath('/');
  revalidatePath('/money');
}

export async function createTransfer(data: {
  amount: number;
  from_account_id: string;
  to_account_id: string;
  date: string;
  description?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from('transactions').insert({
    project_id: DEFAULT_PROJECT_ID,
    type: 'transfer',
    amount: data.amount,
    account_id: data.from_account_id,
    to_account_id: data.to_account_id,
    date: data.date,
    payment_method: 'bank_transfer',
    description: data.description || 'Transfer between accounts',
  });

  if (error) {
    console.error('Failed to create transfer:', error);
    throw new Error('Failed to create transfer');
  }

  revalidatePath('/');
  revalidatePath('/money');
}

export async function getRecentTransactions(limit = 20) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('*, party:parties(name)')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Failed to load transactions');
  return data || [];
}
