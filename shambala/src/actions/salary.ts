'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { SalaryRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createSalaryRecord(data: Partial<SalaryRecord>) {
  const supabase = await createClient();

  const { error } = await supabase.from('salary_records').insert({
    project_id: DEFAULT_PROJECT_ID,
    employee_id: data.employee_id,
    worker_type_id: data.worker_type_id || null,
    start_date: data.start_date,
    end_date: data.end_date,
    amount: data.amount,
    payment_date: data.payment_date,
    payment_method: data.payment_method || 'cash',
    cash_provider_id: data.cash_provider_id || null,
    comments: data.comments || null,
  });

  if (error) throw new Error('Failed to save salary record');

  revalidatePath('/');
  revalidatePath('/salary');
}

export async function getSalaryRecords(limit = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('salary_records')
    .select(`
      *,
      employee:parties!salary_records_employee_id_fkey(name),
      worker_type:worker_types(name),
      cash_provider:parties!salary_records_cash_provider_id_fkey(name)
    `)
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Failed to load salary records');
  return data;
}
