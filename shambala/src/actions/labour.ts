'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { LabourRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createLabourRecord(data: Partial<LabourRecord> & { account_id?: string }) {
  const supabase = await createClient();

  const { data: record, error } = await supabase.from('labour_records').insert({
    project_id: DEFAULT_PROJECT_ID,
    worker_id: data.worker_id,
    worker_type_id: data.worker_type_id,
    work_type_id: data.work_type_id,
    building_id: data.building_id,
    date: data.date,
    time: data.time || null,
    amount: data.amount || null,
    cash_provider_id: data.cash_provider_id || null,
    payment_method: data.payment_method || 'cash',
    comments: data.comments || null,
  }).select('id').single();

  if (error) {
    console.error('Failed to create labour record:', error);
    throw new Error('Failed to save labour record');
  }

  // Generate transaction if there is an amount paid
  if (data.amount && data.amount > 0) {
    await supabase.from('transactions').insert({
      project_id: DEFAULT_PROJECT_ID,
      type: 'operational_expense',
      date: data.date,
      amount: data.amount,
      party_id: data.worker_id,
      account_id: data.account_id || null,
      payment_method: data.payment_method || 'cash',
      reference_table: 'labour_records',
      reference_id: record.id,
      description: `Labour payment for ${data.date}`,
    });
  }

  revalidatePath('/');
  revalidatePath('/labour');
}

export async function getLabourRecords(limit = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('labour_records')
    .select(`
      *,
      worker:parties!labour_records_worker_id_fkey(name),
      worker_type:worker_types(name),
      work_type:work_types(name),
      building:buildings(display_name),
      cash_provider:parties!labour_records_cash_provider_id_fkey(name)
    `)
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Failed to load labour records');
  return data;
}
