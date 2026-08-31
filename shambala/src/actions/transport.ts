'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID, DEFAULT_CASH_ACCOUNT_ID } from '@/lib/constants';

export async function createStandaloneTransportRecord(data: any) {
  const supabase = await createClient();

  const { data: record, error } = await supabase
    .from('transport_records')
    .insert({
      project_id: DEFAULT_PROJECT_ID,
      vehicle_id: data.vehicle_id,
      amount: data.amount,
      payment_method: data.payment_method,
      status: 'completed',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Auto-deduct from cash/bank if paid
  if (data.amount && data.payment_method && data.payment_method !== 'credit') {
    const { error: txnError } = await supabase.from('transactions').insert({
      project_id: DEFAULT_PROJECT_ID,
      account_id: DEFAULT_CASH_ACCOUNT_ID, // Use actual account based on payment_method in real app
      amount: data.amount,
      type: 'operational_expense',
      reference_table: 'transport_records',
      reference_id: record.id,
      date: data.date,
      description: `Transport fee (standalone)`,
    });
    if (txnError) console.error('Failed to create transport txn', txnError);
  }

  return record;
}
