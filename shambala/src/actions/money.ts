'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { postVoucher, getLedgerId } from './accounting';

export async function addMoneyIn(data: {
  amount: number;
  account_id: string;
  party_id?: string;
  date: string;
  payment_method?: string;
  description?: string;
}) {
  try {
    // A Money In transaction debits Cash/Bank and credits Owner Capital (or Loan)
    const ownerCapitalLedgerId = await getLedgerId('Owner Capital');

    await postVoucher({
      voucher_no: `MI-${Date.now()}`,
      type: 'Receipt',
      date: data.date,
      narration: data.description || 'Cash received',
      lines: [
        {
          ledger_id: data.account_id, // This is the ID of the cash/bank account
          debit: data.amount,
          party_id: data.party_id || null,
        },
        {
          ledger_id: ownerCapitalLedgerId,
          credit: data.amount,
          party_id: data.party_id || null,
        }
      ]
    });
  } catch (error: any) {
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
  try {
    await postVoucher({
      voucher_no: `TR-${Date.now()}`,
      type: 'Contra', // Transfers are Contra vouchers
      date: data.date,
      narration: data.description || 'Transfer between accounts',
      lines: [
        {
          ledger_id: data.to_account_id,
          debit: data.amount,
        },
        {
          ledger_id: data.from_account_id,
          credit: data.amount,
        }
      ]
    });
  } catch (error: any) {
    console.error('Failed to create transfer:', error);
    throw new Error('Failed to create transfer');
  }

  revalidatePath('/');
  revalidatePath('/money');
}

export async function getRecentTransactions(limit = 20) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      id,
      voucher_no,
      type,
      date,
      narration,
      created_at,
      lines:voucher_lines(
        debit,
        credit,
        ledger:ledger_accounts(name, account_group),
        party:parties(name)
      )
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Failed to load transactions');
  return data || [];
}
