'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { VoucherType } from '@/lib/types';

export interface VoucherLineInput {
  ledger_id: string;
  party_id?: string | null;
  cost_center_id?: string | null;
  debit?: number;
  credit?: number;
  due_date?: string | null;
}

export interface PostVoucherParams {
  voucher_no: string;
  type: VoucherType;
  date: string;
  narration?: string;
  reference_table?: string;
  reference_id?: string;
  lines: VoucherLineInput[];
}

export async function postVoucher(params: PostVoucherParams) {
  const supabase = await createClient();

  // Validate balance
  const totalDebit = params.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = params.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error(`Voucher is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`);
  }

  const { data, error } = await supabase.rpc('post_voucher', {
    p_project_id: DEFAULT_PROJECT_ID,
    p_voucher_no: params.voucher_no,
    p_type: params.type,
    p_date: params.date,
    p_narration: params.narration || null,
    p_reference_table: params.reference_table || null,
    p_reference_id: params.reference_id || null,
    p_lines: params.lines
  });

  if (error) {
    console.error('Accounting engine post error:', error);
    throw new Error(error.message);
  }

  return data; // Returns the UUID of the inserted voucher
}

/**
 * Resolves a ledger account ID by its name. 
 * Note: In a real app with many concurrent calls, this should be cached heavily.
 */
export async function getLedgerId(name: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ledger_accounts')
    .select('id')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .eq('name', name)
    .single();

  if (error || !data) {
    throw new Error(`Ledger account not found for name: ${name}`);
  }

  return data.id;
}

