'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { SalaryRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createSalaryRecord(data: Partial<SalaryRecord> & { account_id?: string }) {
  const supabase = await createClient();

  const { data: record, error } = await supabase.from('salary_records').insert({
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
  }).select('id').single();

  if (error) {
    console.error('Failed to create salary record:', error);
    throw new Error('Failed to save salary record');
  }

  // Generate transaction if there is an amount paid
  if (data.amount && data.amount > 0) {
    await supabase.from('transactions').insert({
      project_id: DEFAULT_PROJECT_ID,
      type: 'operational_expense',
      date: data.payment_date || data.start_date,
      amount: data.amount,
      party_id: data.employee_id,
      account_id: data.account_id || null,
      payment_method: data.payment_method || 'cash',
      reference_table: 'salary_records',
      reference_id: record.id,
      description: `Salary payment for ${data.start_date}`,
    });
  }

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
